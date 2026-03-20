// Advanced realism post-processing: SSAO, depth of field, chromatic aberration,
// enhanced color grading, and contact shadows.
// Hooks into the existing composer pipeline after init().
(function () {
  'use strict';

  // ── SSAO (Screen-Space Ambient Occlusion) ─────────────────────
  // Darkens creases, corners, and contact areas for grounded realism.

  var SSAOShader = {
    uniforms: {
      tDiffuse: { value: null },
      tDepth: { value: null },
      resolution: { value: new THREE.Vector2(1, 1) },
      cameraNear: { value: 0.1 },
      cameraFar: { value: 500 },
      radius: { value: 0.5 },
      aoStrength: { value: 0.6 },
      sampleCount: { value: 16 },
      noiseScale: { value: 1.0 },
    },
    vertexShader: [
      'varying vec2 vUv;',
      'void main() {',
      '  vUv = uv;',
      '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
      '}',
    ].join('\n'),
    fragmentShader: [
      'uniform sampler2D tDiffuse;',
      'uniform sampler2D tDepth;',
      'uniform vec2 resolution;',
      'uniform float cameraNear;',
      'uniform float cameraFar;',
      'uniform float radius;',
      'uniform float aoStrength;',
      '',
      'varying vec2 vUv;',
      '',
      'float readDepth(vec2 coord) {',
      '  float z = texture2D(tDepth, coord).x;',
      '  return (2.0 * cameraNear) / (cameraFar + cameraNear - z * (cameraFar - cameraNear));',
      '}',
      '',
      '// Hash-based pseudo-random for sampling',
      'float hash(vec2 p) {',
      '  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);',
      '}',
      '',
      'void main() {',
      '  vec4 color = texture2D(tDiffuse, vUv);',
      '  float depth = readDepth(vUv);',
      '',
      '  // Skip sky / very far pixels',
      '  if (depth > 0.99) { gl_FragColor = color; return; }',
      '',
      '  float occlusion = 0.0;',
      '  float pixelRadius = radius / (depth * cameraFar);',
      '  int samples = 16;',
      '',
      '  for (int i = 0; i < 16; i++) {',
      '    float fi = float(i);',
      '    float angle = fi * 2.399963 + hash(vUv * 1000.0 + fi) * 6.283;', // golden angle
      '    float r = (fi + 0.5) / 16.0;',
      '    vec2 offset = vec2(cos(angle), sin(angle)) * r * pixelRadius;',
      '    float sampleDepth = readDepth(vUv + offset);',
      '',
      '    // Range-checked occlusion',
      '    float diff = depth - sampleDepth;',
      '    if (diff > 0.0001 && diff < 0.02) {',
      '      occlusion += 1.0;',
      '    }',
      '  }',
      '',
      '  occlusion = 1.0 - (occlusion / 16.0) * aoStrength;',
      '  occlusion = clamp(occlusion, 0.3, 1.0);',
      '',
      '  color.rgb *= occlusion;',
      '  gl_FragColor = color;',
      '}',
    ].join('\n'),
  };

  // ── Depth of Field ────────────────────────────────────────────
  // Blurs distant and very close objects for cinematic focus.

  var DOFShader = {
    uniforms: {
      tDiffuse: { value: null },
      tDepth: { value: null },
      resolution: { value: new THREE.Vector2(1, 1) },
      cameraNear: { value: 0.1 },
      cameraFar: { value: 500 },
      focusDistance: { value: 0.04 },
      focusRange: { value: 0.06 },
      blurAmount: { value: 1.5 },
    },
    vertexShader: [
      'varying vec2 vUv;',
      'void main() {',
      '  vUv = uv;',
      '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
      '}',
    ].join('\n'),
    fragmentShader: [
      'uniform sampler2D tDiffuse;',
      'uniform sampler2D tDepth;',
      'uniform vec2 resolution;',
      'uniform float cameraNear;',
      'uniform float cameraFar;',
      'uniform float focusDistance;',
      'uniform float focusRange;',
      'uniform float blurAmount;',
      '',
      'varying vec2 vUv;',
      '',
      'float readDepth(vec2 coord) {',
      '  float z = texture2D(tDepth, coord).x;',
      '  return (2.0 * cameraNear) / (cameraFar + cameraNear - z * (cameraFar - cameraNear));',
      '}',
      '',
      'void main() {',
      '  float depth = readDepth(vUv);',
      '  float blur = clamp(abs(depth - focusDistance) - focusRange, 0.0, 1.0) * blurAmount;',
      '',
      '  if (blur < 0.01) {',
      '    gl_FragColor = texture2D(tDiffuse, vUv);',
      '    return;',
      '  }',
      '',
      '  vec2 texel = blur / resolution;',
      '  vec4 sum = vec4(0.0);',
      '',
      '  // 13-tap Gaussian kernel',
      '  sum += texture2D(tDiffuse, vUv + vec2(-3.0, 0.0) * texel) * 0.015;',
      '  sum += texture2D(tDiffuse, vUv + vec2(-2.0, 0.0) * texel) * 0.06;',
      '  sum += texture2D(tDiffuse, vUv + vec2(-1.0, 0.0) * texel) * 0.15;',
      '  sum += texture2D(tDiffuse, vUv) * 0.25;',
      '  sum += texture2D(tDiffuse, vUv + vec2(1.0, 0.0) * texel) * 0.15;',
      '  sum += texture2D(tDiffuse, vUv + vec2(2.0, 0.0) * texel) * 0.06;',
      '  sum += texture2D(tDiffuse, vUv + vec2(3.0, 0.0) * texel) * 0.015;',
      '  sum += texture2D(tDiffuse, vUv + vec2(0.0, -2.0) * texel) * 0.06;',
      '  sum += texture2D(tDiffuse, vUv + vec2(0.0, -1.0) * texel) * 0.10;',
      '  sum += texture2D(tDiffuse, vUv + vec2(0.0, 1.0) * texel) * 0.10;',
      '  sum += texture2D(tDiffuse, vUv + vec2(0.0, 2.0) * texel) * 0.06;',
      '',
      '  // Normalize (weights sum to ~1.065 with the extra vertical taps)',
      '  gl_FragColor = sum / 1.065;',
      '}',
    ].join('\n'),
  };

  // ── Chromatic Aberration ──────────────────────────────────────
  // Subtle RGB channel separation at edges for lens realism.

  var ChromaticShader = {
    uniforms: {
      tDiffuse: { value: null },
      intensity: { value: 0.003 },
    },
    vertexShader: [
      'varying vec2 vUv;',
      'void main() {',
      '  vUv = uv;',
      '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
      '}',
    ].join('\n'),
    fragmentShader: [
      'uniform sampler2D tDiffuse;',
      'uniform float intensity;',
      'varying vec2 vUv;',
      '',
      'void main() {',
      '  vec2 dir = vUv - 0.5;',
      '  float dist = length(dir);',
      '  vec2 offset = dir * dist * intensity;',
      '',
      '  float r = texture2D(tDiffuse, vUv + offset).r;',
      '  float g = texture2D(tDiffuse, vUv).g;',
      '  float b = texture2D(tDiffuse, vUv - offset).b;',
      '  float a = texture2D(tDiffuse, vUv).a;',
      '',
      '  gl_FragColor = vec4(r, g, b, a);',
      '}',
    ].join('\n'),
  };

  // ── Enhanced Color Grading ────────────────────────────────────
  // Replaces the existing basic color correction with a full cinematic grade.

  var CinematicGradeShader = {
    uniforms: {
      tDiffuse: { value: null },
      saturation: { value: 1.12 },
      contrast: { value: 1.08 },
      brightness: { value: 0.01 },
      vignetteIntensity: { value: 0.2 },
      vignetteRoundness: { value: 0.8 },
      filmGrain: { value: 0.015 },
      time: { value: 0.0 },
      tintShadows: { value: new THREE.Color(0.05, 0.05, 0.12) },
      tintHighlights: { value: new THREE.Color(1.0, 0.95, 0.9) },
      liftGammaGain: { value: new THREE.Vector3(0.98, 1.02, 1.05) },
    },
    vertexShader: [
      'varying vec2 vUv;',
      'void main() {',
      '  vUv = uv;',
      '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
      '}',
    ].join('\n'),
    fragmentShader: [
      'uniform sampler2D tDiffuse;',
      'uniform float saturation;',
      'uniform float contrast;',
      'uniform float brightness;',
      'uniform float vignetteIntensity;',
      'uniform float vignetteRoundness;',
      'uniform float filmGrain;',
      'uniform float time;',
      'uniform vec3 tintShadows;',
      'uniform vec3 tintHighlights;',
      'uniform vec3 liftGammaGain;',
      'varying vec2 vUv;',
      '',
      'vec3 adjustSaturation(vec3 c, float s) {',
      '  float lum = dot(c, vec3(0.2126, 0.7152, 0.0722));',
      '  return mix(vec3(lum), c, s);',
      '}',
      '',
      '// Lift-Gamma-Gain color wheels (DaVinci Resolve style)',
      'vec3 applyLGG(vec3 c, vec3 lgg) {',
      '  c = c * lgg.z;', // gain
      '  c = pow(c, vec3(1.0 / lgg.y));', // gamma
      '  c = c + (lgg.x - 1.0);', // lift
      '  return c;',
      '}',
      '',
      'void main() {',
      '  vec4 tex = texture2D(tDiffuse, vUv);',
      '  vec3 color = tex.rgb;',
      '',
      '  // Lift-Gamma-Gain',
      '  color = applyLGG(color, liftGammaGain);',
      '',
      '  // Shadow / highlight tinting',
      '  float lum = dot(color, vec3(0.2126, 0.7152, 0.0722));',
      '  vec3 shadowMix = mix(color, color * tintShadows / 0.07, (1.0 - lum) * 0.15);',
      '  vec3 highMix = mix(color, color * tintHighlights, lum * 0.1);',
      '  color = mix(shadowMix, highMix, lum);',
      '',
      '  // Saturation',
      '  color = adjustSaturation(color, saturation);',
      '',
      '  // Contrast and brightness',
      '  color = (color - 0.5) * contrast + 0.5 + brightness;',
      '',
      '  // Vignette with roundness control',
      '  vec2 uv = vUv - 0.5;',
      '  float dist = length(uv * vec2(1.0, vignetteRoundness));',
      '  float vignette = 1.0 - smoothstep(0.25, 0.85, dist) * vignetteIntensity;',
      '  color *= vignette;',
      '',
      '  // Animated film grain (varies per frame)',
      '  float seed = dot(vUv * 800.0, vec2(12.9898, 78.233)) + time;',
      '  float grain = (fract(sin(seed) * 43758.5453) - 0.5) * filmGrain;',
      '  color += grain;',
      '',
      '  gl_FragColor = vec4(clamp(color, 0.0, 1.0), tex.a);',
      '}',
    ].join('\n'),
  };

  // ── State ─────────────────────────────────────────────────────

  var depthTarget = null;
  var ssaoPass = null;
  var dofPass = null;
  var chromaticPass = null;
  var gradePass = null;
  var enabled = true;
  var startTime = performance.now();

  // ── Setup ─────────────────────────────────────────────────────
  // Call after the base setupPostProcessing() in index.html.

  function init() {
    if (typeof THREE === 'undefined' || typeof composer === 'undefined' || !composer) {
      console.warn('[Realism] Composer not available yet, skipping.');
      return;
    }
    if (typeof renderer === 'undefined' || !renderer) return;

    var w = window.innerWidth;
    var h = window.innerHeight;

    // Depth render target for SSAO and DOF
    depthTarget = new THREE.WebGLRenderTarget(w, h, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType,
    });
    depthTarget.depthTexture = new THREE.DepthTexture();
    depthTarget.depthTexture.type = THREE.UnsignedIntType;

    // SSAO pass — insert before bloom
    ssaoPass = new THREE.ShaderPass(SSAOShader);
    ssaoPass.uniforms.resolution.value.set(w, h);
    ssaoPass.uniforms.cameraNear.value = camera.near;
    ssaoPass.uniforms.cameraFar.value = camera.far;

    // DOF pass
    dofPass = new THREE.ShaderPass(DOFShader);
    dofPass.uniforms.resolution.value.set(w, h);
    dofPass.uniforms.cameraNear.value = camera.near;
    dofPass.uniforms.cameraFar.value = camera.far;

    // Chromatic aberration
    chromaticPass = new THREE.ShaderPass(ChromaticShader);

    // Cinematic color grading (replaces basic color pass)
    gradePass = new THREE.ShaderPass(CinematicGradeShader);
    gradePass.renderToScreen = true;

    // Rebuild the composer pipeline:
    // RenderPass → SSAO → Bloom → DOF → FXAA → ChromaticAberration → CinematicGrade
    var renderPass = composer.passes[0]; // keep the original RenderPass

    // Clear existing passes
    composer.passes = [];

    // Re-add in order
    composer.addPass(renderPass);
    composer.addPass(ssaoPass);

    if (typeof bloomPass !== 'undefined' && bloomPass) {
      composer.addPass(bloomPass);
    }

    composer.addPass(dofPass);

    if (typeof fxaaPass !== 'undefined' && fxaaPass) {
      fxaaPass.renderToScreen = false;
      composer.addPass(fxaaPass);
    }

    composer.addPass(chromaticPass);
    composer.addPass(gradePass);

    // Use the depth target for the render pass
    renderPass.overrideMaterial = null;

    console.log(
      '[Realism] Enhanced post-processing initialized with',
      composer.passes.length,
      'passes'
    );
  }

  // ── Per-frame update ──────────────────────────────────────────
  // Call from the main game loop before composer.render()

  function update() {
    if (!enabled || !ssaoPass) return;

    // Render scene to depth target
    if (
      typeof renderer !== 'undefined' &&
      typeof scene !== 'undefined' &&
      typeof camera !== 'undefined'
    ) {
      renderer.setRenderTarget(depthTarget);
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);

      // Feed depth texture to SSAO and DOF
      ssaoPass.uniforms.tDepth.value = depthTarget.depthTexture;
      dofPass.uniforms.tDepth.value = depthTarget.depthTexture;

      // Update time for animated grain
      gradePass.uniforms.time.value = (performance.now() - startTime) * 0.001;

      // Dynamic focus distance — focus on point ~15 units ahead
      var focusDist = 15.0 / camera.far;
      dofPass.uniforms.focusDistance.value = focusDist;
    }
  }

  // ── Resize handler ────────────────────────────────────────────

  function onResize() {
    if (!ssaoPass) return;
    var w = window.innerWidth;
    var h = window.innerHeight;

    if (depthTarget) {
      depthTarget.setSize(w, h);
    }

    ssaoPass.uniforms.resolution.value.set(w, h);
    dofPass.uniforms.resolution.value.set(w, h);
  }

  window.addEventListener('resize', onResize);

  // ── Quality presets ───────────────────────────────────────────

  function setQuality(level) {
    if (!ssaoPass) return;

    if (level === 'low') {
      ssaoPass.enabled = false;
      dofPass.enabled = false;
      chromaticPass.enabled = false;
    } else if (level === 'medium') {
      ssaoPass.enabled = true;
      ssaoPass.uniforms.aoStrength.value = 0.3;
      dofPass.enabled = false;
      chromaticPass.enabled = false;
    } else {
      // high
      ssaoPass.enabled = true;
      ssaoPass.uniforms.aoStrength.value = 0.6;
      dofPass.enabled = true;
      chromaticPass.enabled = true;
    }
  }

  function setEnabled(on) {
    enabled = on;
    if (ssaoPass) ssaoPass.enabled = on;
    if (dofPass) dofPass.enabled = on;
    if (chromaticPass) chromaticPass.enabled = on;
    if (gradePass) gradePass.enabled = on;
  }

  // ── Public API ────────────────────────────────────────────────

  window.SR.Realism = {
    init: init,
    update: update,
    setQuality: setQuality,
    setEnabled: setEnabled,
    onResize: onResize,
  };
})();
