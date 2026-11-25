import { useEffect, useRef } from 'react';

const VERT = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;

// Flowing mesh-gradient in Obsidian, Brioche Amber, Arcane Violet & Sage Mint
const FRAG = `precision highp float;
uniform vec2 r;uniform float t;
vec3 hash3(vec2 p){return fract(sin(vec3(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3)),dot(p,vec2(419.2,371.9))))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
float a=hash3(i).x,b=hash3(i+vec2(1,0)).x,c=hash3(i+vec2(0,1)).x,d=hash3(i+vec2(1,1)).x;
return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p*=2.02;a*=.5;}return v;}
void main(){
 vec2 uv=gl_FragCoord.xy/r;
 vec2 p=uv*vec2(r.x/r.y,1.)*1.55;
 float s=t*.055;
 vec2 q=vec2(fbm(p+s),fbm(p+vec2(5.2,1.3)-s));
 vec2 w=vec2(fbm(p+2.8*q+vec2(1.7,9.2)+s*1.4),fbm(p+2.8*q+vec2(8.3,2.8)-s));
 float f=fbm(p+2.8*w);
 vec3 bg=vec3(.042,.032,.062);
 vec3 ember=vec3(.92,.52,.14);
 vec3 gold=vec3(.99,.78,.36);
 vec3 arcane=vec3(.56,.22,.92);
 vec3 col=mix(bg,arcane,smoothstep(.32,.86,f)*.68);
 col=mix(col,ember,smoothstep(.45,.95,f*length(q))*0.82);
 col=mix(col,gold,smoothstep(.74,1.,q.y*f)*.45);
 float line=smoothstep(.018,.0,abs(fract(f*5.5-t*.045)-.5)-.472);
 col+=gold*line*.28*f;
 col*=smoothstep(.0,.78,uv.x)*.88+.14;
 gl_FragColor=vec4(col,1.);
}`;

export function HearthGradient({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    const gl = c?.getContext('webgl', { antialias: false, alpha: false });
    if (!c || !gl) return;

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type);
      if (!sh) return null;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return sh;
    };

    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    const prog = gl.createProgram();
    if (!vs || !fs || !prog) return;

    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uR = gl.getUniformLocation(prog, 'r');
    const uT = gl.getUniformLocation(prog, 't');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let raf = 0;
    const t0 = performance.now();
    const frame = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5) * 0.6;
      const w = Math.max(1, Math.floor(c.clientWidth * dpr));
      const h = Math.max(1, Math.floor(c.clientHeight * dpr));
      if (c.width !== w || c.height !== h) {
        c.width = w;
        c.height = h;
        gl.viewport(0, 0, w, h);
      }
      gl.uniform2f(uR, w, h);
      gl.uniform1f(uT, (performance.now() - t0) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!reduce) raf = requestAnimationFrame(frame);
    };

    frame();
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={ref} aria-hidden="true" className={className} />;
}
