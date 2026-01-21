// Vercel Serverless Function for cloud saves
// Note: For production, you'd want to integrate with a database like Vercel KV or Planetscale

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // For demo purposes, we'll use a simple in-memory store
    // In production, replace this with Vercel KV, Planetscale, or another database

    if (req.method === 'GET') {
        // Return default data - in production, fetch from database using player ID
        return res.status(200).json({
            coins: 100,
            ownedItems: ['sword', 'fireball']
        });
    }

    if (req.method === 'POST') {
        try {
            const data = req.body;
            // In production, save to database with player ID
            console.log('Save request received:', data);
            return res.status(200).json({
                success: true,
                coins: data.coins,
                ownedItems: data.ownedItems
            });
        } catch (e) {
            return res.status(400).json({ error: 'Invalid data' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
