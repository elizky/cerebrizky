'use client';

import { useEffect, useRef } from 'react';

import { cn } from '@/lib/utils';

export type AuroraBand = {
  key: string;
  weight: number;
};

type AuroraBackgroundProps = {
  className?: string;
  bands: AuroraBand[];
  lineColor?: string;
  bgColor1?: string;
  bgColor2?: string;
  overallSpeed?: number;
  scale?: number;
  lineAmplitude?: number;
  lineFrequency?: number;
  warpAmplitude?: number;
  warpFrequency?: number;
};

const MAX_LINES = 8;

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b] as const;
}

function bandWidths(bands: AuroraBand[]): Float32Array {
  const widths = new Float32Array(MAX_LINES);
  const active = bands.slice(0, MAX_LINES);
  if (active.length === 0) {
    widths[0] = 0.018;
    return widths;
  }

  const maxWeight = Math.max(...active.map((b) => b.weight), 1);

  for (let i = 0; i < active.length; i++) {
    const t = Math.sqrt(active[i].weight / maxWeight);
    widths[i] = 0.006 + t * 0.032;
  }

  return widths;
}

const VS = `
  attribute vec4 aVertexPosition;
  void main() {
    gl_Position = aVertexPosition;
  }
`;

const FS = `
  precision highp float;
  uniform vec2 iResolution;
  uniform float iTime;
  uniform vec3 uLineColor;
  uniform vec3 uBgColor1;
  uniform vec3 uBgColor2;
  uniform float uOverallSpeed;
  uniform float uScale;
  uniform float uLineAmplitude;
  uniform float uLineFrequency;
  uniform float uWarpAmplitude;
  uniform float uWarpFrequency;
  uniform int uLineCount;
  uniform float uWidths[${MAX_LINES}];

  const float gridSmoothWidth = 0.015;
  const float lineSpeed = 1.0;
  const float warpSpeed = 0.2;
  const float offsetFrequency = 0.5;
  const float offsetSpeed = 1.33;
  const float minOffsetSpread = 0.6;
  const float maxOffsetSpread = 2.0;

  #define drawCircle(pos, radius, coord) smoothstep(radius + gridSmoothWidth, radius, length(coord - (pos)))
  #define drawSmoothLine(pos, halfWidth, t) smoothstep(halfWidth, 0.0, abs(pos - (t)))
  #define drawCrispLine(pos, halfWidth, t) smoothstep(halfWidth + gridSmoothWidth, halfWidth, abs(pos - (t)))

  float random(float t) {
    return (cos(t) + cos(t * 1.3 + 1.3) + cos(t * 1.4 + 1.4)) / 3.0;
  }

  float getPlasmaY(float x, float horizontalFade, float offset) {
    return random(x * uLineFrequency + iTime * lineSpeed * uOverallSpeed)
      * horizontalFade * uLineAmplitude + offset;
  }

  void main() {
    vec2 fragCoord = gl_FragCoord.xy;
    vec2 uv = fragCoord.xy / iResolution.xy;
    vec2 space = (fragCoord - iResolution.xy / 2.0) / iResolution.x * 2.0 * uScale;

    float horizontalFade = 1.0 - (cos(uv.x * 6.28) * 0.5 + 0.5);
    float verticalFade = 1.0 - (cos(uv.y * 6.28) * 0.5 + 0.5);

    space.y += random(space.x * uWarpFrequency + iTime * warpSpeed * uOverallSpeed)
      * uWarpAmplitude * (0.5 + horizontalFade);
    space.x += random(space.y * uWarpFrequency + iTime * warpSpeed * uOverallSpeed + 2.0)
      * uWarpAmplitude * horizontalFade;

    vec4 lines = vec4(0.0);
    float count = float(uLineCount);

    for (int l = 0; l < ${MAX_LINES}; l++) {
      if (l >= uLineCount) break;
      float normalizedLineIndex = float(l) / max(count, 1.0);
      float offsetTime = iTime * offsetSpeed * uOverallSpeed;
      float offsetPosition = float(l) + space.x * offsetFrequency;
      float intensity = 0.16 + 0.1 * (1.0 - normalizedLineIndex);
      float halfWidth = uWidths[l] * (0.65 + 0.25 * horizontalFade);
      float offset = random(offsetPosition + offsetTime * (1.0 + normalizedLineIndex))
        * mix(minOffsetSpread, maxOffsetSpread, horizontalFade);
      float linePosition = getPlasmaY(space.x, horizontalFade, offset);
      float line = drawSmoothLine(linePosition, halfWidth, space.y) * 0.55
        + drawCrispLine(linePosition, halfWidth * 0.08, space.y) * 0.35;

      float circleX = mod(float(l) + iTime * lineSpeed * uOverallSpeed, 25.0) - 12.0;
      vec2 circlePosition = vec2(circleX, getPlasmaY(circleX, horizontalFade, offset));
      float circle = drawCircle(circlePosition, 0.008, space) * 1.1;

      line = line + circle;
      lines += line * vec4(uLineColor, 1.0) * intensity;
    }

    vec4 fragColor = mix(vec4(uBgColor1, 1.0), vec4(uBgColor2, 1.0), uv.x);
    fragColor *= verticalFade;
    fragColor.a = 1.0;
    fragColor.rgb += lines.rgb * 0.5;

    vec2 center = uv - 0.5;
    float vignette = 1.0 - smoothstep(0.35, 1.15, length(center) * 1.1);
    fragColor.rgb *= mix(0.75, 1.0, vignette);

    gl_FragColor = fragColor;
  }
`;

export function AuroraBackground({
  className,
  bands,
  lineColor = '#8A7418',
  bgColor1 = '#1a1a1a',
  bgColor2 = '#222018',
  overallSpeed = 0.18,
  scale = 5,
  lineAmplitude = 0.9,
  lineFrequency = 0.2,
  warpAmplitude = 0.85,
  warpFrequency = 0.45,
}: AuroraBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bandsRef = useRef(bands);

  useEffect(() => {
    bandsRef.current = bands;
  }, [bands]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      powerPreference: 'low-power',
    });
    if (!gl) return;

    function compile(type: number, source: string) {
      const shader = gl!.createShader(type);
      if (!shader) return null;
      gl!.shaderSource(shader, source);
      gl!.compileShader(shader);
      if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
        gl!.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vs = compile(gl.VERTEX_SHADER, VS);
    const fs = compile(gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const positionLoc = gl.getAttribLocation(program, 'aVertexPosition');
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    const u = {
      resolution: gl.getUniformLocation(program, 'iResolution'),
      time: gl.getUniformLocation(program, 'iTime'),
      lineColor: gl.getUniformLocation(program, 'uLineColor'),
      bgColor1: gl.getUniformLocation(program, 'uBgColor1'),
      bgColor2: gl.getUniformLocation(program, 'uBgColor2'),
      overallSpeed: gl.getUniformLocation(program, 'uOverallSpeed'),
      scale: gl.getUniformLocation(program, 'uScale'),
      lineAmplitude: gl.getUniformLocation(program, 'uLineAmplitude'),
      lineFrequency: gl.getUniformLocation(program, 'uLineFrequency'),
      warpAmplitude: gl.getUniformLocation(program, 'uWarpAmplitude'),
      warpFrequency: gl.getUniformLocation(program, 'uWarpFrequency'),
      lineCount: gl.getUniformLocation(program, 'uLineCount'),
      widths: gl.getUniformLocation(program, 'uWidths'),
    };

    const lineRgb = hexToRgb(lineColor);
    const bg1 = hexToRgb(bgColor1);
    const bg2 = hexToRgb(bgColor2);

    let animationId = 0;
    let width = 0;
    let height = 0;
    const start = performance.now();

    function resize() {
      width = container!.offsetWidth;
      height = container!.offsetHeight;
      if (width <= 0 || height <= 0) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.max(1, Math.floor(width * dpr));
      canvas!.height = Math.max(1, Math.floor(height * dpr));
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      gl!.viewport(0, 0, canvas!.width, canvas!.height);
    }

    function tick() {
      const active = bandsRef.current.slice(0, MAX_LINES);
      const count = Math.max(active.length, 1);
      const widths = bandWidths(active);

      gl!.uniform2f(u.resolution, canvas!.width, canvas!.height);
      gl!.uniform1f(u.time, (performance.now() - start) / 1000);
      gl!.uniform3f(u.lineColor, lineRgb[0], lineRgb[1], lineRgb[2]);
      gl!.uniform3f(u.bgColor1, bg1[0], bg1[1], bg1[2]);
      gl!.uniform3f(u.bgColor2, bg2[0], bg2[1], bg2[2]);
      gl!.uniform1f(u.overallSpeed, overallSpeed);
      gl!.uniform1f(u.scale, scale);
      gl!.uniform1f(u.lineAmplitude, lineAmplitude);
      gl!.uniform1f(u.lineFrequency, lineFrequency);
      gl!.uniform1f(u.warpAmplitude, warpAmplitude);
      gl!.uniform1f(u.warpFrequency, warpFrequency);
      gl!.uniform1i(u.lineCount, count);
      gl!.uniform1fv(u.widths, widths);

      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
      animationId = requestAnimationFrame(tick);
    }

    const resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(container);
    resize();
    animationId = requestAnimationFrame(tick);

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationId);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buffer);
    };
  }, [
    lineColor,
    bgColor1,
    bgColor2,
    overallSpeed,
    scale,
    lineAmplitude,
    lineFrequency,
    warpAmplitude,
    warpFrequency,
  ]);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
      style={{ backgroundColor: bgColor1 }}
    >
      <canvas ref={canvasRef} className='block h-full w-full' />
    </div>
  );
}
