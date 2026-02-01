import type * as Party from 'partykit/server';

interface PlayerSocialData {
  deviceId: string;
  username: string;
  friendCode: string;
  friends: string[]; // Array of deviceIds
  pendingRequests: { fromDeviceId: string; fromUsername: string; fromFriendCode: string }[];
}

interface FriendsServer {
  roomId: string;
  hostDeviceId: string;
  hostUsername: string;
  allowedDeviceIds: string[];
  active: boolean;
}

export default class SocialServer implements Party.Server {
  constructor(readonly room: Party.Room) {}

  // In-memory lookup of connected deviceId -> connection
  connections: Record<string, Party.Connection> = {};

  async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    // Wait for register message to associate deviceId
    console.log(`Social connection: ${conn.id}`);
  }

  async onClose(conn: Party.Connection) {
    // Remove from connections map
    for (const [deviceId, c] of Object.entries(this.connections)) {
      if (c.id === conn.id) {
        delete this.connections[deviceId];
        // Deactivate any friends servers this player hosts
        await this.deactivateHostedServers(deviceId);
        break;
      }
    }
  }

  async onMessage(message: string, sender: Party.Connection) {
    try {
      const data = JSON.parse(message);
      switch (data.type) {
        case 'register':
          await this.handleRegister(sender, data);
          break;
        case 'send_friend_request':
          await this.handleSendFriendRequest(sender, data);
          break;
        case 'respond_friend_request':
          await this.handleRespondFriendRequest(sender, data);
          break;
        case 'remove_friend':
          await this.handleRemoveFriend(sender, data);
          break;
        case 'get_friends':
          await this.handleGetFriends(sender, data);
          break;
        case 'create_friends_server':
          await this.handleCreateFriendsServer(sender, data);
          break;
        case 'close_friends_server':
          await this.handleCloseFriendsServer(sender, data);
          break;
        case 'validate_join':
          await this.handleValidateJoin(sender, data);
          break;
      }
    } catch (e) {
      console.error('Social server error:', e);
    }
  }

  async getPlayerData(deviceId: string): Promise<PlayerSocialData | null> {
    return (await this.room.storage.get<PlayerSocialData>(`player:${deviceId}`)) || null;
  }

  async savePlayerData(data: PlayerSocialData): Promise<void> {
    await this.room.storage.put(`player:${data.deviceId}`, data);
  }

  generateFriendCode(username: string): string {
    const num = Math.floor(1000 + Math.random() * 9000);
    return `${username}#${num}`;
  }

  async handleRegister(conn: Party.Connection, data: { deviceId: string; username: string }) {
    const { deviceId, username } = data;
    this.connections[deviceId] = conn;

    let playerData = await this.getPlayerData(deviceId);
    if (!playerData) {
      // New player - generate friend code
      let friendCode = this.generateFriendCode(username);
      // Ensure uniqueness by checking storage
      let attempts = 0;
      while (attempts < 10) {
        const existing = await this.room.storage.get<string>(`code:${friendCode}`);
        if (!existing) break;
        friendCode = this.generateFriendCode(username);
        attempts++;
      }
      playerData = {
        deviceId,
        username,
        friendCode,
        friends: [],
        pendingRequests: [],
      };
      await this.room.storage.put(`code:${friendCode}`, deviceId);
    } else {
      // Update username if changed
      if (playerData.username !== username) {
        // Remove old friend code mapping, create new one
        await this.room.storage.delete(`code:${playerData.friendCode}`);
        const newCode = this.generateFriendCode(username);
        playerData.username = username;
        playerData.friendCode = newCode;
        await this.room.storage.put(`code:${newCode}`, deviceId);
      }
    }

    await this.savePlayerData(playerData);

    // Get active friends servers
    const servers = await this.getActiveFriendsServers(deviceId);

    conn.send(
      JSON.stringify({
        type: 'registered',
        friendCode: playerData.friendCode,
        friends: await this.enrichFriendsList(playerData.friends),
        pendingRequests: playerData.pendingRequests,
        friendsServers: servers,
      })
    );
  }

  async enrichFriendsList(
    friendDeviceIds: string[]
  ): Promise<{ deviceId: string; username: string; friendCode: string; online: boolean }[]> {
    const result = [];
    for (const fid of friendDeviceIds) {
      const fData = await this.getPlayerData(fid);
      if (fData) {
        result.push({
          deviceId: fData.deviceId,
          username: fData.username,
          friendCode: fData.friendCode,
          online: !!this.connections[fid],
        });
      }
    }
    return result;
  }

  async handleSendFriendRequest(
    conn: Party.Connection,
    data: { deviceId: string; targetFriendCode: string }
  ) {
    const { deviceId, targetFriendCode } = data;
    const senderData = await this.getPlayerData(deviceId);
    if (!senderData) return;

    // Look up target by friend code
    const targetDeviceId = await this.room.storage.get<string>(`code:${targetFriendCode}`);
    if (!targetDeviceId) {
      conn.send(JSON.stringify({ type: 'friend_request_error', message: 'Player not found.' }));
      return;
    }

    if (targetDeviceId === deviceId) {
      conn.send(
        JSON.stringify({ type: 'friend_request_error', message: "You can't add yourself." })
      );
      return;
    }

    const targetData = await this.getPlayerData(targetDeviceId);
    if (!targetData) {
      conn.send(JSON.stringify({ type: 'friend_request_error', message: 'Player not found.' }));
      return;
    }

    // Check if already friends
    if (senderData.friends.includes(targetDeviceId)) {
      conn.send(
        JSON.stringify({
          type: 'friend_request_error',
          message: 'Already friends with this player.',
        })
      );
      return;
    }

    // Check if request already pending
    const alreadyPending = targetData.pendingRequests.some(r => r.fromDeviceId === deviceId);
    if (alreadyPending) {
      conn.send(
        JSON.stringify({ type: 'friend_request_error', message: 'Friend request already sent.' })
      );
      return;
    }

    // Add to target's pending requests
    targetData.pendingRequests.push({
      fromDeviceId: deviceId,
      fromUsername: senderData.username,
      fromFriendCode: senderData.friendCode,
    });
    await this.savePlayerData(targetData);

    conn.send(JSON.stringify({ type: 'friend_request_sent', targetFriendCode }));

    // Notify target if online
    const targetConn = this.connections[targetDeviceId];
    if (targetConn) {
      targetConn.send(
        JSON.stringify({
          type: 'friend_request_received',
          fromDeviceId: deviceId,
          fromUsername: senderData.username,
          fromFriendCode: senderData.friendCode,
        })
      );
    }
  }

  async handleRespondFriendRequest(
    conn: Party.Connection,
    data: { deviceId: string; fromDeviceId: string; accept: boolean }
  ) {
    const { deviceId, fromDeviceId, accept } = data;
    const playerData = await this.getPlayerData(deviceId);
    if (!playerData) return;

    // Remove from pending
    playerData.pendingRequests = playerData.pendingRequests.filter(
      r => r.fromDeviceId !== fromDeviceId
    );

    if (accept) {
      // Add to both friends lists
      if (!playerData.friends.includes(fromDeviceId)) {
        playerData.friends.push(fromDeviceId);
      }
      const senderData = await this.getPlayerData(fromDeviceId);
      if (senderData && !senderData.friends.includes(deviceId)) {
        senderData.friends.push(deviceId);
        await this.savePlayerData(senderData);

        // Notify sender if online
        const senderConn = this.connections[fromDeviceId];
        if (senderConn) {
          senderConn.send(
            JSON.stringify({
              type: 'friend_request_accepted',
              deviceId: deviceId,
              username: playerData.username,
              friendCode: playerData.friendCode,
            })
          );
        }
      }
    }

    await this.savePlayerData(playerData);

    // Send updated friends list
    conn.send(
      JSON.stringify({
        type: 'friends_updated',
        friends: await this.enrichFriendsList(playerData.friends),
        pendingRequests: playerData.pendingRequests,
      })
    );
  }

  async handleRemoveFriend(
    conn: Party.Connection,
    data: { deviceId: string; friendDeviceId: string }
  ) {
    const { deviceId, friendDeviceId } = data;
    const playerData = await this.getPlayerData(deviceId);
    if (!playerData) return;

    playerData.friends = playerData.friends.filter(f => f !== friendDeviceId);
    await this.savePlayerData(playerData);

    // Remove from other side too
    const friendData = await this.getPlayerData(friendDeviceId);
    if (friendData) {
      friendData.friends = friendData.friends.filter(f => f !== deviceId);
      await this.savePlayerData(friendData);
    }

    conn.send(
      JSON.stringify({
        type: 'friends_updated',
        friends: await this.enrichFriendsList(playerData.friends),
        pendingRequests: playerData.pendingRequests,
      })
    );
  }

  async handleGetFriends(conn: Party.Connection, data: { deviceId: string }) {
    const playerData = await this.getPlayerData(data.deviceId);
    if (!playerData) return;

    const servers = await this.getActiveFriendsServers(data.deviceId);

    conn.send(
      JSON.stringify({
        type: 'friends_updated',
        friends: await this.enrichFriendsList(playerData.friends),
        pendingRequests: playerData.pendingRequests,
        friendsServers: servers,
      })
    );
  }

  async handleCreateFriendsServer(conn: Party.Connection, data: { deviceId: string }) {
    const { deviceId } = data;
    const playerData = await this.getPlayerData(deviceId);
    if (!playerData) return;

    const roomId = 'friends-' + Math.random().toString(36).substr(2, 8);
    const allowedDeviceIds = [deviceId, ...playerData.friends];

    const server: FriendsServer = {
      roomId,
      hostDeviceId: deviceId,
      hostUsername: playerData.username,
      allowedDeviceIds,
      active: true,
    };

    await this.room.storage.put(`server:${roomId}`, server);

    // Track server by host
    const hostedServers = (await this.room.storage.get<string[]>(`hosted:${deviceId}`)) || [];
    hostedServers.push(roomId);
    await this.room.storage.put(`hosted:${deviceId}`, hostedServers);

    const wsUrl = `wss://game.hadijaffri.partykit.dev/parties/main/${roomId}`;

    conn.send(
      JSON.stringify({
        type: 'friends_server_created',
        roomId,
        wsUrl,
      })
    );

    // Notify all online friends
    for (const friendId of playerData.friends) {
      const friendConn = this.connections[friendId];
      if (friendConn) {
        friendConn.send(
          JSON.stringify({
            type: 'friends_server_available',
            roomId,
            hostUsername: playerData.username,
            hostDeviceId: deviceId,
          })
        );
      }
    }
  }

  async handleCloseFriendsServer(
    conn: Party.Connection,
    data: { deviceId: string; roomId: string }
  ) {
    const { deviceId, roomId } = data;
    const server = await this.room.storage.get<FriendsServer>(`server:${roomId}`);
    if (!server || server.hostDeviceId !== deviceId) return;

    server.active = false;
    await this.room.storage.put(`server:${roomId}`, server);

    conn.send(JSON.stringify({ type: 'friends_server_closed', roomId }));
  }

  async handleValidateJoin(conn: Party.Connection, data: { deviceId: string; roomId: string }) {
    const { deviceId, roomId } = data;
    const server = await this.room.storage.get<FriendsServer>(`server:${roomId}`);

    if (!server || !server.active) {
      conn.send(JSON.stringify({ type: 'join_denied', reason: 'Server no longer active.' }));
      return;
    }

    if (!server.allowedDeviceIds.includes(deviceId)) {
      conn.send(
        JSON.stringify({
          type: 'join_denied',
          reason: 'You are not on the friends list for this server.',
        })
      );
      return;
    }

    const wsUrl = `wss://game.hadijaffri.partykit.dev/parties/main/${roomId}`;
    conn.send(JSON.stringify({ type: 'join_approved', roomId, wsUrl }));
  }

  async getActiveFriendsServers(
    deviceId: string
  ): Promise<{ roomId: string; hostUsername: string; hostDeviceId: string }[]> {
    const playerData = await this.getPlayerData(deviceId);
    if (!playerData) return [];

    const servers: { roomId: string; hostUsername: string; hostDeviceId: string }[] = [];
    const allDeviceIds = [deviceId, ...playerData.friends];

    for (const did of allDeviceIds) {
      const hostedRoomIds = (await this.room.storage.get<string[]>(`hosted:${did}`)) || [];
      for (const roomId of hostedRoomIds) {
        const server = await this.room.storage.get<FriendsServer>(`server:${roomId}`);
        if (server && server.active && server.allowedDeviceIds.includes(deviceId)) {
          servers.push({
            roomId: server.roomId,
            hostUsername: server.hostUsername,
            hostDeviceId: server.hostDeviceId,
          });
        }
      }
    }

    return servers;
  }

  async deactivateHostedServers(deviceId: string) {
    const hostedRoomIds = (await this.room.storage.get<string[]>(`hosted:${deviceId}`)) || [];
    for (const roomId of hostedRoomIds) {
      const server = await this.room.storage.get<FriendsServer>(`server:${roomId}`);
      if (server && server.active) {
        server.active = false;
        await this.room.storage.put(`server:${roomId}`, server);
      }
    }
  }
}
