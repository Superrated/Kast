/* ==== 31-elevation.js ====
   elevSVG(S,G,o): the front drawing (SVG) with sizes, the things in the room and the design notes markers.
*/
/* ===== Elevation ===== */
const n1 = v => (+v).toFixed(1);
function propSVG(p, Y) {
  const x = p.x,
    y = p.y,
    st = 'stroke="rgba(0,0,0,.28)" stroke-width="1.5"';
  switch (p.k) {
    case 'book':
      return `<rect x="${n1(x)}" y="${n1(Y(y + p.h))}" width="${n1(p.w)}" height="${n1(p.h)}" fill="${p.col}" ${st}/><rect x="${n1(x)}" y="${n1(Y(y + p.h * 0.84))}" width="${n1(p.w)}" height="${n1(Math.max(4, p.h * 0.04))}" fill="rgba(255,255,255,.35)"/>`;
    case 'stack': {
      let s = '';
      const c = ['#2F4858', '#C9A86A', '#7A3B2E'];
      for (let i = 0; i < 3; i++)
        s += `<rect x="${n1(x + i * 8)}" y="${n1(Y(y + (i + 1) * 22))}" width="${n1(p.w - i * 16)}" height="22" fill="${c[i]}" ${st}/>`;
      return s;
    }
    case 'plant': {
      const cx = x + p.w / 2,
        pw = p.w * 0.72,
        ph = p.potH,
        fh = p.h - ph,
        r = prng(Math.round(x * 7 + y * 3));
      let s = '';
      if (p.fol === 'tall') {
        for (let i = 0; i < 7; i++) {
          const a = (i - 3) * 0.22 + (r() - 0.5) * 0.15,
            L = fh * (0.7 + r() * 0.3);
          s += `<path d="M${n1(cx)} ${n1(Y(y + ph))} Q${n1(cx + Math.sin(a) * L * 0.5)} ${n1(Y(y + ph + L * 0.6))} ${n1(cx + Math.sin(a) * L)} ${n1(Y(y + ph + L * Math.cos(a)))}" stroke="${LEAFC[i % 4]}" stroke-width="${n1(p.w * 0.1)}" stroke-linecap="round" fill="none"/>`;
        }
      } else {
        const R = p.w * 0.36;
        for (let i = 0; i < 9; i++) {
          const ex = cx + (r() - 0.5) * p.w * 0.8,
            ey = y + ph + R * 0.55 + r() * Math.max(10, fh - R * 1.3);
          s += `<ellipse cx="${n1(ex)}" cy="${n1(Y(ey))}" rx="${n1(R * (0.45 + r() * 0.35))}" ry="${n1(R * (0.35 + r() * 0.3))}" fill="${LEAFC[i % 4]}"/>`;
        }
        if (p.fol === 'trail') {
          for (let i = 0; i < 4; i++) {
            const sx = cx + (i < 2 ? -1 : 1) * pw * (0.3 + r() * 0.2),
              len = ph * (0.8 + r() * 1.3);
            s += `<path d="M${n1(sx)} ${n1(Y(y + ph + 5))} q${n1((r() - 0.5) * 30)} ${n1(len * 0.5)} ${n1((r() - 0.5) * 20)} ${n1(len)}" stroke="${LEAFC[(i + 1) % 4]}" stroke-width="10" stroke-dasharray="14 8" stroke-linecap="round" fill="none"/>`;
          }
        }
      }
      return (
        s +
        `<path d="M${n1(cx - pw / 2)} ${n1(Y(y + ph))} L${n1(cx + pw / 2)} ${n1(Y(y + ph))} L${n1(cx + pw * 0.38)} ${n1(Y(y))} L${n1(cx - pw * 0.38)} ${n1(Y(y))} Z" fill="${p.pot}" ${st}/>`
      );
    }
    case 'vase': {
      const w = p.w,
        h = p.h;
      return `<path d="M${n1(x + w * 0.36)} ${n1(Y(y + h))} L${n1(x + w * 0.64)} ${n1(Y(y + h))} C${n1(x + w * 0.7)} ${n1(Y(y + h * 0.75))} ${n1(x + w)} ${n1(Y(y + h * 0.55))} ${n1(x + w * 0.88)} ${n1(Y(y + h * 0.1))} L${n1(x + w * 0.78)} ${n1(Y(y))} L${n1(x + w * 0.22)} ${n1(Y(y))} L${n1(x + w * 0.12)} ${n1(Y(y + h * 0.1))} C${n1(x)} ${n1(Y(y + h * 0.55))} ${n1(x + w * 0.3)} ${n1(Y(y + h * 0.75))} ${n1(x + w * 0.36)} ${n1(Y(y + h))} Z" fill="${p.col}" ${st}/>`;
    }
    case 'box':
      return `<rect x="${n1(x)}" y="${n1(Y(y + p.h))}" width="${n1(p.w)}" height="${n1(p.h)}" rx="4" fill="${p.col}" ${st}/><rect x="${n1(x + p.w / 2 - 25)}" y="${n1(Y(y + p.h * 0.75))}" width="50" height="14" rx="7" fill="rgba(0,0,0,.35)"/>`;
    case 'frame':
      return `<rect x="${n1(x)}" y="${n1(Y(y + p.h))}" width="${n1(p.w)}" height="${n1(p.h)}" fill="#2A2A2A"/><rect x="${n1(x + 10)}" y="${n1(Y(y + p.h - 10))}" width="${n1(p.w - 20)}" height="${n1(p.h - 20)}" fill="#F1EDE4"/><circle cx="${n1(x + p.w / 2)}" cy="${n1(Y(y + p.h * 0.55))}" r="${n1(p.w * 0.22)}" fill="${p.col}"/>`;
    case 'laptop':
      return `<rect x="${n1(x)}" y="${n1(Y(y + 12 + p.d * 0.85))}" width="${n1(p.w)}" height="${n1(p.d * 0.85)}" rx="6" fill="#A9ADB1" ${st}/><rect x="${n1(x - 6)}" y="${n1(Y(y + 12))}" width="${n1(p.w + 12)}" height="12" rx="3" fill="#8D9195"/>`;
    case 'lamp': {
      const cx = x + p.w / 2,
        h = p.h;
      return `<ellipse cx="${n1(cx)}" cy="${n1(Y(y + 8))}" rx="${n1(p.w * 0.42)}" ry="10" fill="#2B2B2B"/><line x1="${n1(cx)}" x2="${n1(cx)}" y1="${n1(Y(y + 10))}" y2="${n1(Y(y + h - 100))}" stroke="#2B2B2B" stroke-width="8"/><path d="M${n1(cx - 45)} ${n1(Y(y + h))} L${n1(cx + 45)} ${n1(Y(y + h))} L${n1(cx + 80)} ${n1(Y(y + h - 110))} L${n1(cx - 80)} ${n1(Y(y + h - 110))} Z" fill="#2B2B2B"/><ellipse cx="${n1(cx)}" cy="${n1(Y(y + h - 110))}" rx="78" ry="8" fill="#F6E7B8" opacity=".9"/>`;
    }
    case 'turntable': {
      const pc = x + p.w * 0.42;
      return `<rect x="${n1(x)}" y="${n1(Y(y + p.h))}" width="${n1(p.w)}" height="${n1(p.h)}" rx="8" fill="#26272A"/><rect x="${n1(x)}" y="${n1(Y(y + p.h))}" width="${n1(p.w)}" height="10" rx="4" fill="#3A3C40"/><ellipse cx="${n1(pc)}" cy="${n1(Y(y + p.h) - 6)}" rx="${n1(p.w * 0.34)}" ry="16" fill="#101012"/><ellipse cx="${n1(pc)}" cy="${n1(Y(y + p.h) - 8)}" rx="${n1(p.w * 0.08)}" ry="5" fill="#C96B4B"/><line x1="${n1(x + p.w * 0.86)}" y1="${n1(Y(y + p.h) - 26)}" x2="${n1(x + p.w * 0.62)}" y2="${n1(Y(y + p.h) - 6)}" stroke="#C9CCD0" stroke-width="5" stroke-linecap="round"/><circle cx="${n1(x + p.w * 0.88)}" cy="${n1(Y(y + p.h * 0.45))}" r="7" fill="#7FD3FF"/>`;
    }
    case 'mixer': {
      let k = '';
      for (let r_ = 0; r_ < 3; r_++)
        for (let c = 0; c < 4; c++)
          k += `<circle cx="${n1(x + 40 + (c * (p.w - 80)) / 3)}" cy="${n1(Y(y + p.h * 0.78 - r_ * 22))}" r="7" fill="#C9CCD0"/>`;
      return `<rect x="${n1(x)}" y="${n1(Y(y + p.h))}" width="${n1(p.w)}" height="${n1(p.h)}" rx="8" fill="#1E1F22"/>${k}<rect x="${n1(x + p.w / 2 - 40)}" y="${n1(Y(y + 20))}" width="80" height="8" rx="3" fill="#E4572E"/>`;
    }
    case 'controller':
      return `<rect x="${n1(x)}" y="${n1(Y(y + p.h))}" width="${n1(p.w)}" height="${n1(p.h)}" rx="10" fill="#1E1F22"/><ellipse cx="${n1(x + p.w * 0.22)}" cy="${n1(Y(y + p.h) - 4)}" rx="${n1(p.w * 0.14)}" ry="12" fill="#3A3C40"/><ellipse cx="${n1(x + p.w * 0.78)}" cy="${n1(Y(y + p.h) - 4)}" rx="${n1(p.w * 0.14)}" ry="12" fill="#3A3C40"/><rect x="${n1(x + p.w * 0.42)}" y="${n1(Y(y + p.h * 0.7))}" width="${n1(p.w * 0.16)}" height="10" rx="3" fill="#7FD3FF"/>`;
    case 'headphones':
      return `<path d="M${n1(x + 15)} ${n1(Y(y + 10))} A${n1(p.w / 2 - 15)} ${n1(p.h)} 0 0 1 ${n1(x + p.w - 15)} ${n1(Y(y + 10))}" fill="none" stroke="#2A2A2C" stroke-width="9"/><rect x="${n1(x)}" y="${n1(Y(y + 30))}" width="30" height="34" rx="9" fill="#2A2A2C"/><rect x="${n1(x + p.w - 30)}" y="${n1(Y(y + 30))}" width="30" height="34" rx="9" fill="#2A2A2C"/>`;
    case 'crate': {
      let r_ = '';
      const rr = prng(Math.round(x));
      for (let i = 0; i < 9; i++)
        r_ += `<rect x="${n1(x + 14 + (i * (p.w - 28)) / 9)}" y="${n1(Y(y + p.h + 40 + rr() * 30))}" width="${n1((p.w - 28) / 9 - 3)}" height="${n1(p.h + 20)}" fill="${['#1A1A1A', '#2E3A4F', '#B5503C', '#E2C27A', '#3D3B3A'][i % 5]}"/>`;
      return (
        r_ +
        `<rect x="${n1(x)}" y="${n1(Y(y + p.h))}" width="${n1(p.w)}" height="${n1(p.h)}" rx="6" fill="#C8A97E" stroke="#8C6E48" stroke-width="3"/><rect x="${n1(x + p.w / 2 - 45)}" y="${n1(Y(y + p.h * 0.78))}" width="90" height="20" rx="10" fill="#8C6E48"/>`
      );
    }
    case 'monitor':
      return `<rect x="${n1(x)}" y="${n1(Y(y + p.h))}" width="${n1(p.w)}" height="${n1(p.h)}" rx="10" fill="#1E1E20"/><circle cx="${n1(x + p.w / 2)}" cy="${n1(Y(y + p.h * 0.35))}" r="${n1(p.w * 0.32)}" fill="#0E0E10" stroke="#3A3C40" stroke-width="5"/><circle cx="${n1(x + p.w / 2)}" cy="${n1(Y(y + p.h * 0.78))}" r="${n1(p.w * 0.1)}" fill="#3A3C40"/>`;
    case 'garment': {
      const cx = x + p.w / 2,
        top = y + p.h,
        tw = p.w * 0.7;
      return `<path d="M${n1(cx)} ${n1(Y(p.rail))} q-9 0 -9 9 q0 9 9 9 L${n1(cx)} ${n1(Y(top + 6))}" fill="none" stroke="#5A5047" stroke-width="3"/><path d="M${n1(cx - tw / 2)} ${n1(Y(top))} L${n1(cx + tw / 2)} ${n1(Y(top))} L${n1(x + p.w)} ${n1(Y(top - 60))} L${n1(x + p.w)} ${n1(Y(y))} L${n1(x)} ${n1(Y(y))} L${n1(x)} ${n1(Y(top - 60))} Z" fill="${p.col}" stroke="rgba(0,0,0,.28)" stroke-width="1.5"/><line x1="${n1(x + p.w * 0.5)}" x2="${n1(x + p.w * 0.5)}" y1="${n1(Y(top - 20))}" y2="${n1(Y(y + 10))}" stroke="rgba(0,0,0,.12)" stroke-width="2"/>`;
    }
    case 'bottle': {
      const w = p.w,
        h = p.h,
        nk = w * 0.32;
      return `<path d="M${n1(x)} ${n1(Y(y))} L${n1(x)} ${n1(Y(y + h * 0.62))} Q${n1(x)} ${n1(Y(y + h * 0.74))} ${n1(x + w / 2 - nk / 2)} ${n1(Y(y + h * 0.78))} L${n1(x + w / 2 - nk / 2)} ${n1(Y(y + h))} L${n1(x + w / 2 + nk / 2)} ${n1(Y(y + h))} L${n1(x + w / 2 + nk / 2)} ${n1(Y(y + h * 0.78))} Q${n1(x + w)} ${n1(Y(y + h * 0.74))} ${n1(x + w)} ${n1(Y(y + h * 0.62))} L${n1(x + w)} ${n1(Y(y))}Z" fill="${p.col}" opacity=".9" ${st}/><rect x="${n1(x + 6)}" y="${n1(Y(y + h * 0.45))}" width="${n1(w - 12)}" height="${n1(h * 0.16)}" fill="#F3EEE3" opacity=".85"/>`;
    }
    case 'glass':
      return `<path d="M${n1(x)} ${n1(Y(y + p.h))} L${n1(x + p.w)} ${n1(Y(y + p.h))} L${n1(x + p.w * 0.85)} ${n1(Y(y))} L${n1(x + p.w * 0.15)} ${n1(Y(y))}Z" fill="rgba(220,235,240,.45)" stroke="rgba(0,0,0,.3)" stroke-width="1.5"/>`;
    case 'cup':
      return `<rect x="${n1(x)}" y="${n1(Y(y + p.h))}" width="${n1(p.w)}" height="${n1(p.h)}" rx="10" fill="${p.col}" ${st}/>`;
    case 'coffee':
      return `<rect x="${n1(x)}" y="${n1(Y(y + p.h))}" width="${n1(p.w)}" height="${n1(p.h)}" rx="14" fill="#B9BEC2" ${st}/><rect x="${n1(x + 20)}" y="${n1(Y(y + p.h - 20))}" width="${n1(p.w - 40)}" height="${n1(p.h * 0.28)}" rx="6" fill="#2A2C2E"/><rect x="${n1(x + p.w * 0.3)}" y="${n1(Y(y + p.h * 0.55))}" width="${n1(p.w * 0.4)}" height="${n1(p.h * 0.12)}" fill="#3A3C40"/><rect x="${n1(x + p.w * 0.38)}" y="${n1(Y(y + 70))}" width="${n1(p.w * 0.24)}" height="60" rx="6" fill="#F2F0EA"/><rect x="${n1(x)}" y="${n1(Y(y + 12))}" width="${n1(p.w)}" height="12" fill="#2A2C2E"/>`;
    case 'cushion':
      return `<rect x="${n1(x)}" y="${n1(Y(y + p.h))}" width="${n1(p.w)}" height="${n1(p.h)}" rx="30" fill="${p.col}" ${st}/><line x1="${n1(x + 30)}" x2="${n1(x + p.w - 30)}" y1="${n1(Y(y + p.h * 0.5))}" y2="${n1(Y(y + p.h * 0.5))}" stroke="rgba(0,0,0,.12)" stroke-width="3"/>`;
    case 'pillow':
      return `<path d="M${n1(x + 10)} ${n1(Y(y))} Q${n1(x + p.w / 2)} ${n1(Y(y + 18))} ${n1(x + p.w - 10)} ${n1(Y(y))} Q${n1(x + p.w + 8)} ${n1(Y(y + p.h / 2))} ${n1(x + p.w - 10)} ${n1(Y(y + p.h))} Q${n1(x + p.w / 2)} ${n1(Y(y + p.h - 18))} ${n1(x + 10)} ${n1(Y(y + p.h))} Q${n1(x - 8)} ${n1(Y(y + p.h / 2))} ${n1(x + 10)} ${n1(Y(y))}Z" fill="${p.col}" ${st}/>`;
    case 'record':
      return `<rect x="${n1(x)}" y="${n1(Y(y + p.h))}" width="${n1(p.w)}" height="${n1(p.h)}" fill="${p.col}" ${st}/><circle cx="${n1(x + p.w / 2)}" cy="${n1(Y(y + p.h / 2))}" r="${n1(p.w * 0.3)}" fill="${p.c2}" opacity=".85"/><circle cx="${n1(x + p.w / 2)}" cy="${n1(Y(y + p.h / 2))}" r="${n1(p.w * 0.08)}" fill="#1E1E1E"/>`;
    case 'bowl':
      return `<path d="M${n1(x)} ${n1(Y(y + p.h))} Q${n1(x + p.w / 2)} ${n1(Y(y - p.h * 0.25))} ${n1(x + p.w)} ${n1(Y(y + p.h))} Z" fill="${p.col}" ${st}/>`;
    case 'stand':
      return `<rect x="${n1(x + p.w / 2 - 10)}" y="${n1(Y(y + p.h))}" width="20" height="${n1(p.h)}" fill="#3A3C40"/><rect x="${n1(x - 40)}" y="${n1(Y(y + 8))}" width="${n1(p.w + 80)}" height="8" rx="4" fill="#3A3C40"/>`;
    case 'screen':
      return `<rect x="${n1(x)}" y="${n1(Y(y + p.h))}" width="${n1(p.w)}" height="${n1(p.h)}" rx="8" fill="#1B1D21"/><rect x="${n1(x + 12)}" y="${n1(Y(y + p.h - 12))}" width="${n1(p.w - 24)}" height="${n1(p.h - 24)}" rx="3" fill="#2C4A63"/><path d="M${n1(x + 12)} ${n1(Y(y + 12))} L${n1(x + p.w * 0.55)} ${n1(Y(y + p.h - 12))} L${n1(x + p.w - 12)} ${n1(Y(y + p.h - 12))} L${n1(x + p.w - 12)} ${n1(Y(y + 12))}Z" fill="#3E6B8A" opacity=".55"/>`;
    case 'keyboard':
      return `<rect x="${n1(x)}" y="${n1(Y(y + p.h))}" width="${n1(p.w)}" height="${n1(p.h)}" rx="5" fill="#2A2C30"/>`;
    case 'mat':
      return `<rect x="${n1(x)}" y="${n1(Y(y + 8))}" width="${n1(p.w)}" height="8" fill="#3E7A5E"/>`;
    case 'mirror': {
      const cx = x + p.w / 2,
        r_ = p.w / 2;
      return `<rect x="${n1(cx - p.w * 0.3)}" y="${n1(Y(y + 12))}" width="${n1(p.w * 0.6)}" height="12" rx="6" fill="#B8995A"/><line x1="${n1(cx)}" x2="${n1(cx)}" y1="${n1(Y(y + 12))}" y2="${n1(Y(y + p.h - 2 * r_ + r_))}" stroke="#B8995A" stroke-width="10"/><circle cx="${n1(cx)}" cy="${n1(Y(y + p.h - r_))}" r="${n1(r_)}" fill="#B8995A"/><circle cx="${n1(cx)}" cy="${n1(Y(y + p.h - r_))}" r="${n1(r_ - 12)}" fill="url(#mirrg)"/>`;
    }
    case 'chair': {
      const cx = x + p.w / 2,
        sy = p.seat;
      return `<line x1="${n1(cx)}" x2="${n1(cx)}" y1="${n1(Y(60))}" y2="${n1(Y(sy))}" stroke="#2C2E31" stroke-width="34"/><path d="M${n1(cx - p.w * 0.45)} ${n1(Y(40))} L${n1(cx + p.w * 0.45)} ${n1(Y(40))}" stroke="#2C2E31" stroke-width="22" stroke-linecap="round"/>${[-0.45, 0, 0.45].map(f => `<circle cx="${n1(cx + p.w * f)}" cy="${n1(Y(22))}" r="22" fill="#1A1B1D"/>`).join('')}<rect x="${n1(cx - p.w / 2)}" y="${n1(Y(sy + 70))}" width="${n1(p.w)}" height="70" rx="30" fill="${p.col}"/><rect x="${n1(cx - p.w * 0.42)}" y="${n1(Y(p.h))}" width="${n1(p.w * 0.84)}" height="${n1(p.h - sy - 110)}" rx="40" fill="${p.col}"/><rect x="${n1(cx - 14)}" y="${n1(Y(sy + 110))}" width="28" height="44" fill="#2C2E31"/>`;
    }
    case 'mug':
      return `<rect x="${n1(x)}" y="${n1(Y(y + p.h))}\" width="${n1(p.w)}" height="${n1(p.h)}" rx="8" fill="#F2F0EA" ${st}/><path d="M${n1(x + p.w)} ${n1(Y(y + p.h * 0.78))} q28 0 28 ${n1(p.h * 0.24)} q0 ${n1(p.h * 0.24)} -28 ${n1(p.h * 0.24)}" fill="none" stroke="#F2F0EA" stroke-width="10"/>`;
  }
  return '';
}
function handleSVG(hs, Y, dark, wood) {
  if (!hs || hs.type === 'none') return '';
  const mc = dark ? '#D9DADB' : '#2A2C2E',
    W_ = WOODS[wood] || WOODS.oak,
    wc = W_.c,
    wd = W_.d,
    v = hs.dir === 'v',
    x = hs.x,
    y = hs.y,
    L = hs.len || 0,
    d = hs.d || 30;
  const bar = (th, fill, st, rx) =>
    v
      ? `<rect x="${n1(x - th / 2)}" y="${n1(Y(y + L / 2))}" width="${th}" height="${n1(L)}" rx="${rx}" fill="${fill}" ${st}/>`
      : `<rect x="${n1(x - L / 2)}" y="${n1(Y(y) - th / 2)}" width="${n1(L)}" height="${th}" rx="${rx}" fill="${fill}" ${st}/>`;
  const wst = `stroke="${wd}" stroke-width="2"`;
  switch (hs.type) {
    case 'bar':
      return bar(12, mc, '', 6);
    case 'knob':
      return `<circle cx="${n1(x)}" cy="${n1(Y(y))}" r="${d / 2}" fill="${mc}"/>`;
    case 'woodbar':
      return bar(22, wc, wst, 9);
    case 'woodpull': {
      const e = v
        ? [
            [x, y - L / 2 + 12],
            [x, y + L / 2 - 12]
          ]
        : [
            [x - L / 2 + 12, y],
            [x + L / 2 - 12, y]
          ];
      return (
        bar(18, wc, wst, 8) +
        e.map(([a, b]) => `<circle cx="${n1(a)}" cy="${n1(Y(b))}" r="13" fill="${wd}" opacity=".55"/>`).join('')
      );
    }
    case 'woodknob':
      return `<circle cx="${n1(x)}" cy="${n1(Y(y))}" r="${d / 2}" fill="${wc}" ${wst}/><circle cx="${n1(x - d * 0.12)}" cy="${n1(Y(y) - d * 0.12)}" r="${d * 0.18}" fill="#fff" opacity=".18"/>`;
    case 'lever':
      return `<rect x="${n1(x - 14)}" y="${n1(Y(y) - 55)}" width="28" height="110" rx="6" fill="#9AA0A6" opacity=".85"/><rect x="${n1(hs.sx < 0 ? x - 130 : x)}" y="${n1(Y(y + 30) - 8)}" width="130" height="16" rx="8" fill="#5E646A"/>`;
    case 'woodblock':
      return `<rect x="${n1(x - d / 2)}" y="${n1(Y(y) - d / 2)}" width="${d}" height="${d}" rx="4" fill="${wc}" ${wst}/>`;
    case 'woodcup': {
      const w = L,
        h = L * 0.42;
      return v
        ? `<path d="M${n1(x)} ${n1(Y(y + w / 2))} A${n1(h)} ${n1(w / 2)} 0 0 ${hs.sx < 0 ? 0 : 1} ${n1(x)} ${n1(Y(y - w / 2))} Z" fill="${wc}" ${wst}/>`
        : `<path d="M${n1(x - w / 2)} ${n1(Y(y))} A${n1(w / 2)} ${n1(h)} 0 0 0 ${n1(x + w / 2)} ${n1(Y(y))} Z" fill="${wc}" ${wst}/><rect x="${n1(x - w / 2)}" y="${n1(Y(y) - 3)}" width="${n1(w)}" height="6" fill="${wd}"/>`;
    }
    case 'leather': {
      const e = v
        ? [
            [x, y - L / 2 + 14],
            [x, y + L / 2 - 14]
          ]
        : [
            [x - L / 2 + 14, y],
            [x + L / 2 - 14, y]
          ];
      return (
        bar(18, '#7A4A2A', 'stroke="#4E2E18" stroke-width="2"', 5) +
        e.map(([a, b]) => `<circle cx="${n1(a)}" cy="${n1(Y(b))}" r="3.5" fill="#C9A86A"/>`).join('')
      );
    }
    case 'edge':
      return v
        ? `<rect x="${n1(x - 7)}" y="${n1(Y(y + L / 2))}" width="14" height="${n1(L)}" rx="3" fill="${wc}" ${wst}/>`
        : `<rect x="${n1(x - L / 2)}" y="${n1(Y(y) - 7)}" width="${n1(L)}" height="14" rx="3" fill="${wc}" ${wst}/>`;
    case 'profile':
      return v
        ? `<rect x="${n1(hs.sx < 0 ? x - 24 : x)}" y="${n1(Y(y + L))}" width="24" height="${n1(L)}" fill="${wc}" ${wst}/>`
        : `<rect x="${n1(x)}" y="${n1(Y(y))}" width="${n1(L)}" height="22" fill="${wc}" ${wst}/>`;
    case 'hole':
      return `<circle cx="${n1(x)}" cy="${n1(Y(y))}" r="${d / 2}" fill="#141414"/>`;
    case 'disc': {
      const r_ = d / 2,
        cy = Y(y),
        st = `stroke="${wd}" stroke-width="2"`;
      if (hs.seam)
        return `<path d="M${n1(x)} ${n1(cy - r_)} A${r_} ${r_} 0 0 ${hs.seam === 'L' ? 0 : 1} ${n1(x)} ${n1(cy + r_)} Z" fill="${wc}" ${st}/>`;
      return `<circle cx="${n1(x)}" cy="${n1(cy)}" r="${r_}" fill="${wc}" ${st}/><circle cx="${n1(x)}" cy="${n1(cy)}" r="${r_ * 0.62}" fill="none" stroke="${wd}" stroke-width="1.5" opacity=".35"/>`;
    }
    case 'stick': {
      const hc = hColour();
      return v
        ? `<rect x="${n1(x - 12)}" y="${n1(Y(y + L / 2))}" width="24" height="${n1(L)}" rx="12" fill="${hc}" stroke="rgba(0,0,0,.25)" stroke-width="2"/>`
        : `<rect x="${n1(x - L / 2)}" y="${n1(Y(y) - 12)}" width="${n1(L)}" height="24" rx="12" fill="${hc}" stroke="rgba(0,0,0,.25)" stroke-width="2"/>`;
    }
    case 'cross': {
      const hc = hColour(),
        w_ = d * 0.24;
      return `<g transform="translate(${n1(x)} ${n1(Y(y))})"><rect x="${n1(-d / 2)}" y="${n1(-w_ / 2)}" width="${d}" height="${n1(w_)}" rx="${n1(w_ / 2)}" fill="${hc}" stroke="rgba(0,0,0,.2)" stroke-width="2" transform="rotate(45)"/><rect x="${n1(-d / 2)}" y="${n1(-w_ / 2)}" width="${d}" height="${n1(w_)}" rx="${n1(w_ / 2)}" fill="${hc}" stroke="rgba(0,0,0,.2)" stroke-width="2" transform="rotate(-45)"/></g>`;
    }
    case 'ring': {
      const hc = hColour();
      return `<circle cx="${n1(x)}" cy="${n1(Y(y))}" r="${n1(d / 2 - d * 0.09)}" fill="none" stroke="${hc}" stroke-width="${n1(d * 0.18)}"/>`;
    }
    case 'slot':
      return v
        ? `<rect x="${n1(x - 12.5)}" y="${n1(Y(y + L / 2))}" width="25" height="${n1(L)}" rx="12.5" fill="#141414"/>`
        : `<rect x="${n1(x - L / 2)}" y="${n1(Y(y) - 12.5)}" width="${n1(L)}" height="25" rx="12.5" fill="#141414"/>`;
    case 'groove':
      return v
        ? `<rect x="${n1(hs.sx < 0 ? x - 15 : x)}" y="${n1(Y(y + L))}" width="15" height="${n1(L)}" fill="rgba(0,0,0,.3)"/>`
        : `<rect x="${n1(x)}" y="${n1(Y(y))}" width="${n1(L)}" height="15" fill="rgba(0,0,0,.3)"/>`;
  }
  return '';
}
function muralInner(w, h, seed) {
  const r = prng(seed),
    night = r() < 0.3;
  let s = '';
  const sky = night ? ['#1F2A44', '#2A3757', '#36456A', '#45557C'] : ['#CFE3EA', '#DCEAE6', '#EEE6D3', '#F5DCC2'];
  for (let i = 0; i < 4; i++)
    s += `<rect y="${((h * i) / 4).toFixed(1)}" width="${w}" height="${(h / 4 + 1).toFixed(1)}" fill="${sky[i]}"/>`;
  if (night) {
    for (let i = 0; i < 40; i++)
      s += `<circle cx="${(r() * w).toFixed(0)}" cy="${(r() * h * 0.6).toFixed(0)}" r="${(2 + r() * 4).toFixed(1)}" fill="#F6EFD9" opacity="${(0.5 + r() * 0.5).toFixed(2)}"/>`;
    s += `<circle cx="${(w * 0.72).toFixed(0)}" cy="${(h * 0.2).toFixed(0)}" r="${(Math.min(w, h) * 0.08).toFixed(0)}" fill="#F6EFD9"/>`;
  } else {
    const cx = w * (0.3 + r() * 0.4),
      cy = h * 0.62,
      R = Math.min(w * 0.42, h * 0.42);
    ['#E4572E', '#F3A712', '#E9D66B', '#7FB685', '#669BBC', '#9B93AE'].forEach(
      (c, i) =>
        (s += `<path d="M${(cx - R + i * R * 0.09).toFixed(1)} ${cy.toFixed(1)} A${(R - i * R * 0.09).toFixed(1)} ${(R - i * R * 0.09).toFixed(1)} 0 0 1 ${(cx + R - i * R * 0.09).toFixed(1)} ${cy.toFixed(1)}" fill="none" stroke="${c}" stroke-width="${(R * 0.09).toFixed(1)}"/>`)
    );
    for (let i = 0; i < 3; i++) {
      const x = w * r(),
        y = h * (0.1 + r() * 0.25),
        k = Math.min(w, h) * 0.05;
      s += `<g fill="#FFFFFF" opacity=".9"><ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="${(k * 2).toFixed(0)}" ry="${k.toFixed(0)}"/><ellipse cx="${(x + k * 1.4).toFixed(0)}" cy="${(y - k * 0.6).toFixed(0)}" rx="${(k * 1.3).toFixed(0)}" ry="${(k * 0.9).toFixed(0)}"/></g>`;
    }
  }
  (night ? ['#2F4A3A', '#253C30', '#1A2C22'] : ['#A8C686', '#7FB685', '#4E8A5C']).forEach((c, li) => {
    const base = h * (0.72 + li * 0.09),
      amp = h * 0.05,
      ph = r() * 6;
    let d = `M0 ${h} L0 ${base.toFixed(1)}`;
    for (let x = 0; x <= w; x += w / 16)
      d += ` L${x.toFixed(1)} ${(base - Math.sin((x / w) * Math.PI * 2 + ph) * amp).toFixed(1)}`;
    s += `<path d="${d} L${w} ${h} Z" fill="${c}"/>`;
  });
  return s;
}
function funSVG(f, Y) {
  const st = 'stroke="rgba(0,0,0,.3)" stroke-width="2"';
  if (f.k === 'cork')
    return (
      `<rect x="${n1(f.x0)}" y="${n1(Y(f.y1))}" width="${n1(f.x1 - f.x0)}" height="${n1(f.y1 - f.y0)}" rx="6" fill="url(#pv-cork)" stroke="#8A6239" stroke-width="8"/>` +
      [0, 1, 2, 3]
        .map(i => {
          const r = prng(i * 31 + Math.round(f.x0));
          return `<rect x="${n1(f.x0 + 40 + r() * (f.x1 - f.x0 - 200))}" y="${n1(Y(f.y0 + 60 + r() * (f.y1 - f.y0 - 200) + 140))}" width="130" height="140" fill="${['#F2EFE9', '#F3D9B1', '#D8E6EF', '#F5D6D0'][i]}" transform="rotate(${n1((r() - 0.5) * 10)} ${n1(f.x0 + 100)} ${n1(Y(f.y0 + 200))})"/><circle cx="${n1(f.x0 + 105 + r() * (f.x1 - f.x0 - 260))}" cy="${n1(Y(f.y1 - 40 - r() * 40))}" r="8" fill="${HOLDC[i]}"/>`;
        })
        .join('')
    );
  if (f.k === 'mirror')
    return `<rect x="${n1(f.x0)}" y="${n1(Y(f.y1))}" width="${n1(f.x1 - f.x0)}" height="${n1(f.y1 - f.y0)}" rx="${n1((f.x1 - f.x0) / 2)}" fill="#DDE5E8" stroke="#B9C3C7" stroke-width="10"/><path d="M${n1(f.x0 + (f.x1 - f.x0) * 0.25)} ${n1(Y(f.y1 - 120))} l${n1((f.x1 - f.x0) * 0.25)} -60" stroke="#fff" stroke-width="18" stroke-linecap="round" opacity=".8"/>`;
  if (f.k === 'busy') {
    let o = `<rect x="${n1(f.x0 - 20)}" y="${n1(Y(f.y1 + 20))}" width="${n1(f.x1 - f.x0 + 40)}" height="${n1(f.y1 - f.y0 + 40)}" rx="18" fill="rgba(255,255,255,.35)"/>`;
    f.els.forEach(e => {
      const x = e.x,
        y = Y(e.y),
        s = e.s;
      switch (e.t) {
        case 'spinner':
          o +=
            [0, 1, 2, 3]
              .map(
                i =>
                  `<path d="M${n1(x)} ${n1(y)} L${n1(x + Math.cos((i * Math.PI) / 2) * s * 0.4)} ${n1(y + Math.sin((i * Math.PI) / 2) * s * 0.4)} A${n1(s * 0.4)} ${n1(s * 0.4)} 0 0 1 ${n1(x + Math.cos(((i + 1) * Math.PI) / 2) * s * 0.4)} ${n1(y + Math.sin(((i + 1) * Math.PI) / 2) * s * 0.4)} Z" fill="${HOLDC[i]}"/>`
              )
              .join('') + `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(s * 0.06)}" fill="#2A2A2A"/>`;
          break;
        case 'wheel':
          o +=
            `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(s * 0.4)}" fill="none" stroke="${e.c}" stroke-width="${n1(s * 0.09)}"/>` +
            [0, 1, 2]
              .map(
                i =>
                  `<line x1="${n1(x)}" y1="${n1(y)}" x2="${n1(x + Math.cos(i * 2.094 + 1.57) * s * 0.38)}" y2="${n1(y + Math.sin(i * 2.094 + 1.57) * s * 0.38)}" stroke="${e.c}" stroke-width="${n1(s * 0.06)}"/>`
              )
              .join('') +
            `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(s * 0.1)}" fill="#2A2A2A"/>`;
          break;
        case 'latch':
          o += `<rect x="${n1(x - s * 0.4)}" y="${n1(y - s * 0.12)}" width="${n1(s * 0.8)}" height="${n1(s * 0.24)}" rx="6" fill="#C9CCD0" ${st}/><rect x="${n1(x - s * 0.3)}" y="${n1(y - s * 0.04)}" width="${n1(s * 0.5)}" height="${n1(s * 0.08)}" fill="#8D9399"/><circle cx="${n1(x - s * 0.3)}" cy="${n1(y)}" r="${n1(s * 0.07)}" fill="${e.c}"/>`;
          break;
        case 'switch':
          o += `<rect x="${n1(x - s * 0.25)}" y="${n1(y - s * 0.35)}" width="${n1(s * 0.5)}" height="${n1(s * 0.7)}" rx="10" fill="#F2EFE9" ${st}/><rect x="${n1(x - s * 0.08)}" y="${n1(y - s * 0.2)}" width="${n1(s * 0.16)}" height="${n1(s * 0.22)}" rx="4" fill="${e.c}"/>`;
          break;
        case 'abacus':
          o += [0, 1, 2]
            .map(
              i =>
                `<line x1="${n1(x - s * 0.42)}" x2="${n1(x + s * 0.42)}" y1="${n1(y - s * 0.25 + i * s * 0.25)}" y2="${n1(y - s * 0.25 + i * s * 0.25)}" stroke="#8A6236" stroke-width="5"/>` +
                [0, 1, 2, 3]
                  .map(
                    j =>
                      `<circle cx="${n1(x - s * 0.3 + j * s * 0.12 + (i % 2) * s * 0.2)}" cy="${n1(y - s * 0.25 + i * s * 0.25)}" r="${n1(s * 0.06)}" fill="${HOLDC[(i + j) % HOLDC.length]}"/>`
                  )
                  .join('')
            )
            .join('');
          break;
        case 'door':
          o += `<rect x="${n1(x - s * 0.3)}" y="${n1(y - s * 0.38)}" width="${n1(s * 0.6)}" height="${n1(s * 0.76)}" rx="6" fill="${e.c}" ${st}/><circle cx="${n1(x + s * 0.18)}" cy="${n1(y)}" r="${n1(s * 0.05)}" fill="#F2EFE9"/>`;
          break;
        case 'gears':
          o += [
            [-0.15, 0.1, 0.25],
            [0.2, -0.15, 0.17]
          ]
            .map(
              ([dx, dy, r_], i) =>
                `<circle cx="${n1(x + dx * s)}" cy="${n1(y + dy * s)}" r="${n1(r_ * s)}" fill="${HOLDC[i + 2]}" stroke="${HOLDC[i + 2]}" stroke-width="${n1(s * 0.06)}" stroke-dasharray="${n1(s * 0.05)} ${n1(s * 0.04)}"/><circle cx="${n1(x + dx * s)}" cy="${n1(y + dy * s)}" r="${n1(s * 0.04)}" fill="#2A2A2A"/>`
            )
            .join('');
          break;
        case 'bell':
          o += `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(s * 0.25)}" fill="#D4B04C" stroke="#9C7C25" stroke-width="4"/><rect x="${n1(x + s * 0.2)}" y="${n1(y - s * 0.06)}" width="${n1(s * 0.18)}" height="${n1(s * 0.08)}" fill="#9C7C25"/>`;
          break;
      }
    });
    return o;
  }
  if (f.k === 'marble') {
    let o = '';
    o += `<path d="M${n1(f.ramps[0][0] - 10)} ${n1(Y(f.ramps[0][1] + 130))} l140 0 l-50 110 l-40 0 Z" fill="#E4572E" opacity=".9"/>`;
    f.ramps.forEach(
      ([xa, ya, xb, yb]) =>
        (o += `<line x1="${n1(xa)}" y1="${n1(Y(ya))}" x2="${n1(xb)}" y2="${n1(Y(yb))}" stroke="#B98B57" stroke-width="22" stroke-linecap="round"/><line x1="${n1(xa)}" y1="${n1(Y(ya) - 12)}" x2="${n1(xb)}" y2="${n1(Y(yb) - 12)}" stroke="#8A6236" stroke-width="5" stroke-linecap="round"/>`)
    );
    const r = prng(Math.round(f.x0 * 3));
    f.ramps.forEach(([xa, ya, xb, yb]) => {
      const t = r(),
        mx = xa + (xb - xa) * t,
        my = ya + (yb - ya) * t;
      o += `<circle cx="${n1(mx)}" cy="${n1(Y(my) - 24)}" r="13" fill="${HOLDC[(r() * 5) | 0]}" stroke="rgba(0,0,0,.25)" stroke-width="2"/>`;
    });
    const last = f.ramps[f.ramps.length - 1],
      ex = last[1] < last[3] ? last[0] : last[2];
    return o + `<rect x="${n1(ex - 60)}" y="${n1(Y(f.y0))}" width="120" height="70" rx="12" fill="#669BBC"/>`;
  }
  if (f.k === 'pegs') {
    let o = '';
    const r = prng(f.seed * 7 + 3),
      wood = (FIN[f.fin] || FIN.birch).base,
      dk = 'rgba(55,38,20,.5)',
      ln = 'stroke="rgba(0,0,0,.32)" stroke-width="2"',
      PC = ['#E4572E', '#F3A712', '#669BBC', '#A8C686', '#D3A4C9', '#29335C', '#F0E6D2'];
    f.holes.forEach(([x, y]) => {
      o += f.slot
        ? `<rect x="${n1(x - 6)}" y="${n1(Y(y) - 20)}" width="12" height="40" rx="3" fill="${dk}"/>`
        : `<circle cx="${n1(x)}" cy="${n1(Y(y))}" r="10" fill="${dk}"/>`;
    });
    f.hooks.forEach(h => {
      const x = h.x,
        y = h.y;
      if (h.t === 0)
        o += `<path d="M${x - 12} ${Y(y)} q12 -34 24 0" fill="none" stroke="${h.col}" stroke-width="7"/><rect x="${x - 70}" y="${n1(Y(y - 40))}" width="140" height="170" rx="46" fill="${h.col}" ${ln}/><rect x="${x - 44}" y="${n1(Y(y - 120))}" width="88" height="60" rx="14" fill="rgba(255,255,255,.28)"/>`;
      else if (h.t === 1)
        o += `<path d="M${x - 80} ${Y(y - 30)} h160 q-6 150 -80 150 q-74 0 -80 -150z" fill="#C9A36A" ${ln}/><path d="M${x - 80} ${Y(y - 30)} q80 -70 160 0" fill="none" stroke="#A8824C" stroke-width="6"/>`;
      else if (h.t === 2)
        o += `<path d="M${x} ${Y(y)} l-85 250 q85 34 170 0z" fill="${h.col}" ${ln}/><circle cx="${x}" cy="${n1(Y(y - 150))}" r="24" fill="rgba(255,255,255,.35)"/>`;
      else o += `<circle cx="${x}" cy="${n1(Y(y - 70))}" r="62" fill="none" stroke="${h.col}" stroke-width="16"/>`;
    });
    f.shelves.forEach(sh => {
      o += `<rect x="${n1(sh.x0)}" y="${n1(Y(sh.y + 18))}" width="${n1(sh.x1 - sh.x0)}" height="18" fill="${wood}" ${ln}/>`;
      let x = sh.x0 + 14;
      while (x < sh.x1 - 50) {
        const bw = 22 + r() * 46,
          bh = 70 + r() * 110;
        if (x + bw > sh.x1 - 10) break;
        o += `<rect x="${n1(x)}" y="${n1(Y(sh.y + 18 + bh))}" width="${n1(bw)}" height="${n1(bh)}" rx="3" fill="${PC[(r() * PC.length) | 0]}" ${ln}/>`;
        x += bw + 4 + r() * 30;
      }
    });
    f.boxes.forEach(b => {
      o += `<rect x="${n1(b.x0)}" y="${n1(Y(b.y + b.h))}" width="${n1(b.x1 - b.x0)}" height="${b.h}" rx="5" fill="#F4EFE6" ${ln}/>`;
      for (let x = b.x0 + 24; x < b.x1 - 24; x += 26 + r() * 18)
        o += `<rect x="${n1(x)}" y="${n1(Y(b.y + b.h + 40 + r() * 40))}" width="9" height="${n1(60 + r() * 30)}" fill="${PC[(r() * PC.length) | 0]}"/>`;
      o += `<rect x="${n1(b.x0)}" y="${n1(Y(b.y + 80))}" width="${n1(b.x1 - b.x0)}" height="80" rx="5" fill="#F4EFE6" ${ln}/>`;
    });
    f.drawers.forEach(d => {
      const w = d.x1 - d.x0;
      o += `<rect x="${n1(d.x0)}" y="${n1(Y(d.y + d.h))}" width="${n1(w)}" height="${d.h}" rx="5" fill="${wood}" ${ln}/><rect x="${n1(d.x0 + 12)}" y="${n1(Y(d.y + d.h - 12))}" width="${n1(w - 24)}" height="${d.h - 124}" fill="rgba(60,40,20,.35)"/>`;
      for (let x = d.x0 + 26; x < d.x1 - 26; x += 22 + r() * 14)
        o += `<rect x="${n1(x)}" y="${n1(Y(d.y + d.h - 20))}" width="8" height="${n1(d.h - 140)}" fill="${PC[(r() * PC.length) | 0]}"/>`;
      o += `<rect x="${n1(d.x0 + 14)}" y="${n1(Y(d.y + 108))}" width="${n1(w - 28)}" height="96" rx="4" fill="#FBF8F2" ${ln}/><circle cx="${n1((d.x0 + d.x1) / 2)}" cy="${n1(Y(d.y + 60))}" r="11" fill="${dk}"/>`;
    });
    (f.ledges || []).forEach(lg => {
      const w = lg.x1 - lg.x0;
      lg.books.forEach(b => {
        o += `<rect x="${n1(b.x)}" y="${n1(Y(lg.y + 12 + b.h))}" width="${n1(b.w)}" height="${n1(b.h)}" rx="3" fill="${b.col}" ${ln}/><rect x="${n1(b.x + b.w * 0.18)}" y="${n1(Y(lg.y + 12 + b.h * 0.82))}" width="${n1(b.w * 0.64)}" height="${n1(b.h * 0.22)}" rx="4" fill="rgba(255,255,255,.55)"/>`;
      });
      o += `<rect x="${n1(lg.x0)}" y="${n1(Y(lg.y + 12))}" width="${n1(w)}" height="12" fill="${wood}" ${ln}/><rect x="${n1(lg.x0)}" y="${n1(Y(lg.y + 52))}" width="${n1(w)}" height="40" rx="3" fill="${wood}" ${ln}/><rect x="${n1(lg.x0 - 6)}" y="${n1(Y(lg.y + 100))}" width="12" height="100" rx="3" fill="${wood}" ${ln}/><rect x="${n1(lg.x1 - 6)}" y="${n1(Y(lg.y + 100))}" width="12" height="100" rx="3" fill="${wood}" ${ln}/>`;
    });
    (f.rolls || []).forEach(ro => {
      const w = ro.x1 - ro.x0;
      o += `<rect x="${n1(ro.x0 + 30)}" y="${n1(Y(ro.y + 40) + 30)}" width="${n1(w - 60)}" height="150" fill="#F7F2E8" ${ln}/><rect x="${n1(ro.x0 + 18)}" y="${n1(Y(ro.y + 110))}" width="${n1(w - 36)}" height="80" rx="38" fill="#F2EBDD" ${ln}/><rect x="${n1(ro.x0)}" y="${n1(Y(ro.y + 140))}" width="20" height="140" rx="6" fill="${wood}" ${ln}/><rect x="${n1(ro.x1 - 20)}" y="${n1(Y(ro.y + 140))}" width="20" height="140" rx="6" fill="${wood}" ${ln}/>`;
    });
    (f.rails || []).forEach(ra => {
      o += `<rect x="${n1(ra.x0)}" y="${n1(Y(ra.y + 10))}" width="${n1(ra.x1 - ra.x0)}" height="20" rx="10" fill="${wood}" ${ln}/>`;
      ra.its.forEach(it => {
        const x = it.x,
          yt = ra.y - 8;
        o += `<path d="M${n1(x)} ${n1(Y(yt + 18))} q-10 0 -10 12 q0 12 10 12 l0 14" fill="none" stroke="#3a3a3a" stroke-width="4"/>`;
        const y0 = yt - 30;
        if (it.t === 0)
          o += `<rect x="${n1(x - 9)}" y="${n1(Y(y0))}" width="18" height="${n1(it.h)}" rx="5" fill="${it.col}" ${ln}/><rect x="${n1(x - 9)}" y="${n1(Y(y0) + it.h - 22)}" width="18" height="22" rx="3" fill="#EDEBE4"/>`;
        else if (it.t === 1)
          o += `<path d="M${n1(x - 50)} ${n1(Y(y0) + 20)} q50 -40 100 0 l8 ${n1(it.h)} q-58 22 -116 0z" fill="${it.col}" ${ln}/>`;
        else
          o += `<rect x="${n1(x - 35)}" y="${n1(Y(y0))}" width="70" height="${n1(it.h * 0.8)}" rx="10" fill="${it.col}" ${ln}/>`;
      });
    });
    if (!f.slot)
      f.pegs.forEach(([x, y]) => {
        o += `<circle cx="${n1(x)}" cy="${n1(Y(y))}" r="10" fill="#EAD3A8" ${ln}/>`;
      });
    return o;
  }
  if (f.k === 'ledges') {
    let o = '';
    const r = prng(f.seed * 13 + 5);
    f.ys.forEach(y => {
      let x = f.x0 + 30;
      while (x < f.x1 - 200) {
        const bw = 170 + r() * 90,
          bh = 210 + r() * 80,
          col = ['#E4572E', '#F3A712', '#669BBC', '#A8C686', '#D3A4C9', '#29335C', '#F0E6D2'][(r() * 7) | 0];
        o += `<g transform="rotate(${n1(-4 - r() * 4)} ${n1(x)} ${n1(Y(y))})"><rect x="${n1(x)}" y="${n1(Y(y + bh))}" width="${n1(bw)}" height="${n1(bh)}" rx="5" fill="${col}" ${st}/><circle cx="${n1(x + bw / 2)}" cy="${n1(Y(y + bh * 0.58))}" r="${n1(bw * 0.22)}" fill="rgba(255,255,255,.55)"/><rect x="${n1(x + bw * 0.18)}" y="${n1(Y(y + bh * 0.88))}" width="${n1(bw * 0.64)}" height="12" rx="4" fill="rgba(0,0,0,.25)"/></g>`;
        x += bw + 40 + r() * 50;
      }
      o += `<rect x="${n1(f.x0)}" y="${n1(Y(y + 45))}" width="${n1(f.x1 - f.x0)}" height="45" rx="4" fill="#B98B57" stroke="#8A6236" stroke-width="3"/>`;
    });
    return o;
  }
  if (f.k === 'slats') {
    let o = `<rect x="${n1(f.x0 - 8)}" y="${n1(Y(f.y1 + 8))}" width="${n1(f.x1 - f.x0 + 16)}" height="${n1(f.y1 - f.y0 + 16)}" fill="#1B1C1D"/>`;
    for (let i = 0; i < f.n; i++)
      o += `<rect x="${n1(f.x0 + i * f.pitch)}" y="${n1(Y(f.y1))}" width="${n1(f.sw)}" height="${n1(f.y1 - f.y0)}" fill="url(#pv-${f.wood})" stroke="rgba(0,0,0,.35)" stroke-width="1.5"/>`;
    return o;
  }
  if (f.k === 'frames')
    return f.fr
      .map(e => {
        const x = e.x,
          y = Y(e.y + e.h),
          w = e.w,
          h = e.h,
          b = Math.min(w, h) * 0.07,
          m = Math.min(w, h) * 0.16,
          ix = x + m,
          iy = y + m,
          iw = w - 2 * m,
          ih = h - 2 * m,
          cx = ix + iw / 2,
          cy = iy + ih / 2,
          R = Math.min(iw, ih);
        const art = [
          `<circle cx="${n1(cx)}" cy="${n1(cy)}" r="${n1(R * 0.36)}" fill="${e.col}"/>`,
          `<rect x="${n1(ix)}" y="${n1(cy)}" width="${n1(iw)}" height="${n1(ih / 2)}" fill="${e.col}"/><circle cx="${n1(cx + iw * 0.15)}" cy="${n1(cy - ih * 0.12)}" r="${n1(R * 0.16)}" fill="${e.col2}"/>`,
          `<path d="M${n1(ix)} ${n1(iy + ih)} L${n1(cx)} ${n1(iy + ih * 0.2)} L${n1(ix + iw)} ${n1(iy + ih)} Z" fill="${e.col}"/>`,
          `<path d="M${n1(ix + iw * 0.2)} ${n1(iy + ih)} v${n1(-ih * 0.35)} a${n1(iw * 0.3)} ${n1(iw * 0.3)} 0 0 1 ${n1(iw * 0.6)} 0 v${n1(ih * 0.35)} Z" fill="${e.col}"/>`,
          [0, 1, 2]
            .map(
              i =>
                `<rect x="${n1(ix)}" y="${n1(iy + ih * (0.12 + i * 0.3))}" width="${n1(iw)}" height="${n1(ih * 0.16)}" fill="${i % 2 ? e.col2 : e.col}"/>`
            )
            .join('')
        ][e.a];
        return `<rect x="${n1(x + 6)}" y="${n1(y + 8)}" width="${n1(w)}" height="${n1(h)}" fill="rgba(0,0,0,.18)"/><rect x="${n1(x)}" y="${n1(y)}" width="${n1(w)}" height="${n1(h)}" fill="${e.c}" ${st}/><rect x="${n1(x + b)}" y="${n1(y + b)}" width="${n1(w - 2 * b)}" height="${n1(h - 2 * b)}" fill="#F6F3EC"/>${art}`;
      })
      .join('');
  if (f.k === 'plants')
    return f.pots
      .map(e => {
        const x = e.x,
          y = Y(e.y),
          s = e.s,
          r = prng(e.sd + 3),
          G_ = ['#4F7A3A', '#6E9B4B', '#3F6B45', '#8DB360'];
        let o = '';
        if (e.t === 0)
          for (let i = 0; i < 7; i++) {
            const a = -1.25 + i * 0.42 + (r() - 0.5) * 0.2,
              l = s * (0.9 + r() * 0.7);
            o += `<path d="M${n1(x)} ${n1(y - s * 0.5)} Q${n1(x + Math.sin(a) * l * 0.4)} ${n1(y - s * 0.5 - l * 0.9)} ${n1(x + Math.sin(a) * l)} ${n1(y - s * 0.5 - Math.cos(a) * l * 0.75)}" fill="none" stroke="${G_[i % 4]}" stroke-width="${n1(s * 0.12)}" stroke-linecap="round"/>`;
          }
        else if (e.t === 1)
          for (let i = 0; i < 8; i++)
            o += `<circle cx="${n1(x + (r() - 0.5) * s * 1.1)}" cy="${n1(y - s * 0.6 - r() * s * 0.7)}" r="${n1(s * (0.2 + r() * 0.16))}" fill="${G_[i % 4]}"/>`;
        else
          for (let i = 0; i < 5; i++) {
            const dx = (i - 2) * s * 0.24,
              l = s * (0.8 + r() * 1.3);
            o += `<path d="M${n1(x + dx)} ${n1(y - s * 0.5)} q${n1((r() - 0.5) * 40)} ${n1(-s * 0.3)} ${n1(dx * 0.5)} ${n1(-s * 0.35)}" fill="none" stroke="${G_[i % 4]}" stroke-width="${n1(s * 0.14)}" stroke-linecap="round"/><path d="M${n1(x + dx * 1.5)} ${n1(y - s * 0.45)} q${n1(dx * 0.4 + (r() - 0.5) * 30)} ${n1(l * 0.5)} ${n1((r() - 0.5) * 40)} ${n1(l)}" fill="none" stroke="${G_[(i + 1) % 4]}" stroke-width="${n1(s * 0.09)}" stroke-linecap="round" stroke-dasharray="${n1(s * 0.14)} ${n1(s * 0.1)}"/>`;
          }
        return (
          o +
          `<path d="M${n1(x - s * 0.5)} ${n1(y - s * 0.5)} h${n1(s)} a${n1(s * 0.5)} ${n1(s * 0.55)} 0 0 1 ${n1(-s)} 0 Z" fill="${e.c}" ${st}/>`
        );
      })
      .join('');
  if (f.k === 'bricks')
    return (
      f.plates
        .map(
          e =>
            `<rect x="${n1(e.x + 2)}" y="${n1(Y(e.y + f.P) + 2)}" width="${f.P - 4}" height="${f.P - 4}" rx="4" fill="${e.c}"/>`
        )
        .join('') +
      `<rect x="${n1(f.x0)}" y="${n1(Y(f.y1))}" width="${n1(f.x1 - f.x0)}" height="${n1(f.y1 - f.y0)}" fill="url(#studs)"/>` +
      f.br
        .map(
          e =>
            `<rect x="${n1(e.x)}" y="${n1(Y(e.y + e.h))}" width="${e.w}" height="${n1(e.h)}" rx="2" fill="${e.c}" stroke="rgba(0,0,0,.35)" stroke-width="2"/>`
        )
        .join('')
    );
  if (f.k === 'relief')
    return f.tiles
      .map(e => {
        const s = f.s,
          x = e.x + 3,
          y = Y(e.y + s) + 3,
          w = s - 6,
          c = [
            [x, y],
            [x + w, y],
            [x + w, y + w],
            [x, y + w]
          ],
          a = c[e.o],
          b = c[(e.o + 1) % 4],
          d = c[(e.o + 2) % 4],
          g = c[(e.o + 3) % 4],
          P_ = q => q.map(v => n1(v[0]) + ',' + n1(v[1])).join(' ');
        return `<polygon points="${P_([a, b, d])}" fill="rgba(255,255,255,.26)"/><polygon points="${P_([a, d, g])}" fill="rgba(0,0,0,.2)"/><rect x="${n1(x)}" y="${n1(y)}" width="${n1(w)}" height="${n1(w)}" fill="none" stroke="rgba(0,0,0,.3)" stroke-width="2"/>`;
      })
      .join('');
  if (f.k === 'mural') {
    const w = f.x1 - f.x0,
      h = f.y1 - f.y0;
    return `<svg x="${n1(f.x0)}" y="${n1(Y(f.y1))}" width="${n1(w)}" height="${n1(h)}" viewBox="0 0 ${n1(w)} ${n1(h)}" preserveAspectRatio="none">${muralInner(w, h, f.seed)}</svg>`;
  }
  return '';
}
function fun3D(f) {
  if (!['busy', 'marble', 'ledges', 'mural', 'slats', 'frames', 'plants', 'bricks', 'relief', 'pegs'].includes(f.k))
    return null;
  const G_ = new THREE.Group(),
    zf = geo.tf - (f.z0 || 0),
    M_ = (g, m, x, y, z) => {
      const o = new THREE.Mesh(g, m);
      o.position.set(x, y, z);
      o.castShadow = true;
      G_.add(o);
      return o;
    };
  if (f.k === 'pegs') {
    const wd = mat3(FIN[f.fin] ? f.fin : 'birch', 'ply'),
      pg = mat3('oak', 'solid'),
      wh = colMat('#F4EFE6', 0.6);
    try {
      const hg = f.slot ? new THREE.PlaneGeometry(12, 40) : new THREE.CircleGeometry(10, 14),
        hm = new THREE.MeshBasicMaterial({ color: 0x2a1c10 });
      f.holes.forEach(([x, y]) => {
        const o = new THREE.Mesh(hg, hm);
        o.position.set(x, y, zf + 0.6);
        G_.add(o);
      });
    } catch (e) {
      oops('elevation #1', e);
    }
    if (!f.slot)
      f.pegs.forEach(([x, y]) => {
        const m = M_(new THREE.CylinderGeometry(10, 10, 130, 14), pg, x, y, zf + 55);
        m.rotation.x = Math.PI / 2;
      });
    (f.ledges || []).forEach(lg => {
      const w = lg.x1 - lg.x0,
        cx = (lg.x0 + lg.x1) / 2;
      M_(new THREE.BoxGeometry(w, 12, 90), wd, cx, lg.y + 6, zf + 57);
      M_(new THREE.BoxGeometry(w, 40, 12), wd, cx, lg.y + 32, zf + 96);
      M_(new THREE.BoxGeometry(w, 140, 12), wd, cx, lg.y + 70, zf + 6);
      [lg.x0 + 6, lg.x1 - 6].forEach(x => M_(new THREE.BoxGeometry(12, 100, 90), wd, x, lg.y + 50, zf + 57));
      lg.books.forEach(b => {
        const m = M_(
          new THREE.BoxGeometry(b.w, b.h, 14),
          colMat(b.col, 0.7),
          b.x + b.w / 2,
          lg.y + 12 + b.h / 2,
          zf + 70
        );
        m.rotation.x = -0.18;
      });
    });
    (f.rolls || []).forEach(ro => {
      const w = ro.x1 - ro.x0,
        cx = (ro.x0 + ro.x1) / 2;
      [ro.x0 + 10, ro.x1 - 10].forEach(x => M_(new THREE.BoxGeometry(20, 140, 120), wd, x, ro.y + 70, zf + 60));
      const c = M_(new THREE.CylinderGeometry(40, 40, w - 40, 24), colMat('#F2EBDD', 0.85), cx, ro.y + 70, zf + 70);
      c.rotation.z = Math.PI / 2;
      M_(new THREE.BoxGeometry(w - 60, 150, 1), colMat('#F7F2E8', 0.9), cx, ro.y - 40, zf + 112);
    });
    (f.rails || []).forEach(ra => {
      const w = ra.x1 - ra.x0,
        cx = (ra.x0 + ra.x1) / 2,
        c = M_(new THREE.CylinderGeometry(10, 10, w, 14), wd, cx, ra.y, zf + 70);
      c.rotation.z = Math.PI / 2;
      ra.its.forEach(it => {
        const m =
          it.t === 1
            ? M_(new THREE.BoxGeometry(100, it.h, 40), colMat(it.col, 0.85), it.x, ra.y - 40 - it.h / 2, zf + 70)
            : M_(
                new THREE.BoxGeometry(it.t === 0 ? 18 : 70, it.t === 0 ? it.h : it.h * 0.8, it.t === 0 ? 18 : 30),
                colMat(it.col, 0.6),
                it.x,
                ra.y - 40 - (it.t === 0 ? it.h : it.h * 0.8) / 2,
                zf + 70
              );
      });
    });
    f.shelves.forEach(sh =>
      M_(new THREE.BoxGeometry(sh.x1 - sh.x0, 18, 150), wd, (sh.x0 + sh.x1) / 2, sh.y + 9, zf + 75)
    );
    f.boxes.forEach(b =>
      M_(new THREE.BoxGeometry(b.x1 - b.x0, b.h, 120), wh, (b.x0 + b.x1) / 2, b.y + b.h / 2, zf + 60)
    );
    f.drawers.forEach(d => {
      M_(new THREE.BoxGeometry(d.x1 - d.x0, d.h, 150), wd, (d.x0 + d.x1) / 2, d.y + d.h / 2, zf + 75);
      M_(new THREE.BoxGeometry(d.x1 - d.x0 - 28, 96, 6), wh, (d.x0 + d.x1) / 2, d.y + 60, zf + 152);
    });
    f.hooks.forEach(h => {
      const m = M_(new THREE.SphereGeometry(70, 14, 10), colMat(h.col, 0.8), h.x, h.y - 110, zf + 70);
      m.scale.set(1, 1.25, 0.5);
    });
  }
  if (f.k === 'busy')
    f.els.forEach(e => {
      const c = colMat(e.c, 0.5);
      if (e.t === 'spinner' || e.t === 'wheel' || e.t === 'bell') {
        const m = M_(
          new THREE.CylinderGeometry(e.s * 0.38, e.s * 0.38, e.t === 'wheel' ? 20 : 12, 28),
          c,
          e.x,
          e.y,
          zf + 10
        );
        m.rotation.x = Math.PI / 2;
      } else M_(new THREE.BoxGeometry(e.s * 0.6, e.s * 0.6, 18), c, e.x, e.y, zf + 9);
    });
  if (f.k === 'marble') {
    const wd = mat3('oak', 'solid');
    f.ramps.forEach(([xa, ya, xb, yb]) => {
      const L = Math.hypot(xb - xa, yb - ya),
        m = M_(new THREE.BoxGeometry(L, 14, 70), wd, (xa + xb) / 2, (ya + yb) / 2, zf + 35);
      m.rotation.z = Math.atan2(yb - ya, xb - xa);
    });
  }
  if (f.k === 'ledges') {
    const wd = mat3('oak', 'solid');
    f.ys.forEach(y => {
      M_(new THREE.BoxGeometry(f.x1 - f.x0, 18, 90), wd, (f.x0 + f.x1) / 2, y, zf + 45);
      M_(new THREE.BoxGeometry(f.x1 - f.x0, 45, 12), wd, (f.x0 + f.x1) / 2, y + 22, zf + 90);
    });
    const r = prng(f.seed * 13 + 5);
    f.ys.forEach(y => {
      let x = f.x0 + 30;
      while (x < f.x1 - 200) {
        const bw = 170 + r() * 90,
          bh = 210 + r() * 80,
          m = M_(
            new THREE.BoxGeometry(bw, bh, 10),
            colMat(['#E4572E', '#F3A712', '#669BBC', '#A8C686', '#D3A4C9', '#29335C', '#F0E6D2'][(r() * 7) | 0], 0.7),
            x + bw / 2,
            y + 9 + bh / 2,
            zf + 40
          );
        m.rotation.x = -0.12;
        x += bw + 40 + r() * 50;
      }
    });
  }
  if (f.k === 'slats') {
    const h = f.y1 - f.y0,
      wd = mat3(f.wood, 'solid'),
      o = M_(
        new THREE.BoxGeometry(f.x1 - f.x0 + 16, h + 16, 4),
        colMat('#1B1C1D', 0.95),
        (f.x0 + f.x1) / 2,
        (f.y0 + f.y1) / 2,
        zf + 2
      );
    o.castShadow = false;
    for (let i = 0; i < f.n; i++)
      M_(new THREE.BoxGeometry(f.sw, h, 20), wd, f.x0 + i * f.pitch + f.sw / 2, (f.y0 + f.y1) / 2, zf + 14);
  }
  if (f.k === 'frames')
    f.fr.forEach(e => {
      M_(new THREE.BoxGeometry(e.w, e.h, 22), colMat(e.c, 0.6), e.x + e.w / 2, e.y + e.h / 2, zf + 11);
      const b = Math.min(e.w, e.h) * 0.07,
        m = Math.min(e.w, e.h) * 0.2;
      M_(
        new THREE.BoxGeometry(e.w - 2 * b, e.h - 2 * b, 2),
        colMat('#F6F3EC', 0.9),
        e.x + e.w / 2,
        e.y + e.h / 2,
        zf + 22.5
      ).castShadow = false;
      M_(
        new THREE.BoxGeometry(e.w - 2 * m, e.h - 2 * m, 1),
        colMat(e.col, 0.85),
        e.x + e.w / 2,
        e.y + e.h / 2,
        zf + 24
      ).castShadow = false;
    });
  if (f.k === 'plants') {
    const lf = ['#4F7A3A', '#6E9B4B', '#3F6B45', '#8DB360'].map(c => colMat(c, 0.85));
    f.pots.forEach(e => {
      const s = e.s,
        r = prng(e.sd + 3);
      M_(
        new THREE.CylinderGeometry(s * 0.5, s * 0.34, s * 0.55, 20),
        colMat(e.c, 0.8),
        e.x,
        e.y - s * 0.75,
        zf + s * 0.3
      );
      for (let i = 0; i < 8; i++)
        M_(
          new THREE.SphereGeometry(s * (0.2 + r() * 0.16), 10, 8),
          lf[i % 4],
          e.x + (r() - 0.5) * s * (e.t === 2 ? 1.3 : 1),
          e.y - s * 0.45 + (e.t === 2 ? -r() * s * 1.2 + s * 0.3 : r() * s * (e.t === 0 ? 1.2 : 0.7)),
          zf + s * (0.2 + r() * 0.4)
        );
    });
  }
  if (f.k === 'bricks') {
    f.plates.forEach(e =>
      M_(new THREE.BoxGeometry(f.P - 4, f.P - 4, 4), colMat(e.c, 0.45), e.x + f.P / 2, e.y + f.P / 2, zf + 2)
    );
    f.br.forEach(e => M_(new THREE.BoxGeometry(e.w, e.h, 32), colMat(e.c, 0.4), e.x + e.w / 2, e.y + e.h / 2, zf + 20));
  }
  if (f.k === 'relief') {
    const m = mat3(f.fin, 'mdfpaint');
    f.tiles.forEach(e => {
      const s = f.s - 6,
        o = M_(new THREE.BoxGeometry(s, s, 11), m, e.x + f.s / 2, e.y + f.s / 2, zf + 6.5),
        a = 0.066;
      if (e.o % 2) o.rotation.x = e.o === 1 ? a : -a;
      else o.rotation.y = e.o === 0 ? a : -a;
    });
  }
  if (f.k === 'mural') {
    const w = f.x1 - f.x0,
      h = f.y1 - f.y0,
      img = new Image(),
      tex = new THREE.Texture(img);
    srgb(tex);
    img.onload = () => {
      tex.needsUpdate = true;
      T3.req();
    };
    img.src =
      'data:image/svg+xml;charset=utf-8,' +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="${Math.round((1024 * h) / w)}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">${muralInner(w, h, f.seed)}</svg>`
      );
    M_(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }),
      f.x0 + w / 2,
      f.y0 + h / 2,
      zf + 0.8
    );
  }
  return G_;
}
function elevSVG(S, G, o = {}) {
  const W = G.W,
    tc = G.tc,
    P = G.P,
    M = S.mat,
    mini = !!o.mini;
  const maxC = Math.max(...G.cps.map(p => p.y), +S.room.H, ...G.beams.map(b => b.bottom + 100));
  const T = maxC + (mini ? 50 : 150),
    Y = y => T - y;
  if (!mini && !o.noSizes) ELEV_T = T; // the size readout (32-sizes.js) turns screen points back into mm with it
  const hasPin = G.secs.some(q => q.pin != null),
    CRN = (S.room && S.room.corner) || {},
    exL = CRN.L && CRN.L.dproj ? Math.max(0, -Math.min(CRN.L.dproj.x0, CRN.L.dproj.x1)) : 0,
    exR = CRN.R && CRN.R.dproj ? Math.max(0, Math.max(CRN.R.dproj.x0, CRN.R.dproj.x1)) : 0,
    mx = mini ? 100 : Math.max(260, W * 0.07),
    fa = (W + 2 * mx) / 68,
    mxR = (mini ? 100 : mx + fa * 3) + exR,
    vb = -mx - exL,
    vw = W + mx + exL + mxR,
    vh = T + (mini ? 70 : fa * (hasPin ? 11.2 : 9.1));
  const foc = !mini && o.focus != null && G.secs[o.focus] ? G.secs[o.focus] : null,
    fTop = foc ? Math.max(foc.top(foc.bL), foc.top(foc.bR)) : 0,
    fPad = foc ? Math.max(140, Math.min(320, (foc.bR - foc.bL) * 0.22)) : 0,
    fbox = foc ? { x: foc.bL - fPad, y: T - (fTop + 170), w: foc.bR - foc.bL + 2 * fPad, h: fTop + 170 + 150 } : null,
    vwS = foc ? Math.max(fbox.w, fbox.h * 0.62) * 1.15 : vw;
  const sw = vwS / 800,
    fs = Math.max(foc ? 26 : 30, vwS / 68),
    out = [];
  const push = s => out.push(s);
  const pp = pts => pts.map(p => n1(p[0]) + ',' + n1(Y(p[1]))).join(' ');
  const pvF = f => `url(#pv-${f})`,
    phF = f => `url(#ph-${f})`,
    pv = k => pvF(M[k].fin),
    ph = k => phF(M[k].fin);
  push(
    `<svg viewBox="${fbox ? `${n1(fbox.x)} ${n1(fbox.y)} ${n1(fbox.w)} ${n1(fbox.h)}` : `${vb} 0 ${vw} ${vh}`}" xmlns="http://www.w3.org/2000/svg" font-family="IBM Plex Mono, monospace" role="img" aria-label="Front elevation">`
  );
  const cline = [[0, G.ceilAt(0)], ...G.cps.filter(p => p.x > 0 && p.x < W).map(p => [p.x, p.y]), [W, G.ceilAt(W)]];
  push(`<rect x="${vb}" y="${Y(T)}" width="${vw}" height="${T}" fill="url(#hatch)"/>`);
  push(
    `<polygon points="${pp([[0, 0], [W, 0], ...cline.slice().reverse()])}" ${FIN[S.room.wallFin] ? `fill="${FIN[S.room.wallFin].base}"` : 'style="fill:var(--wall)"'}/>`
  );
  G.beams
    .filter(G.isFull)
    .forEach(b => push(`<rect x="${b.x}" y="${Y(T)}" width="${b.w}" height="${T - b.bottom}" fill="url(#steel)"/>`));
  push(`<polygon points="${pp([[0, T], ...cline, [W, T]])}" fill="url(#hatch)"/>`);
  push(`<polyline points="${pp(cline)}" fill="none" style="stroke:var(--ink2)" stroke-width="${sw * 1.6}"/>`);
  push(
    `<rect x="${vb}" y="${Y(0)}" width="${vw}" height="${mini ? 40 : 60}" fill="url(#hatch)"/><line x1="${vb}" x2="${vb + vw}" y1="${Y(0)}" y2="${Y(0)}" style="stroke:var(--ink)" stroke-width="${sw * 2}"/>`
  );
  const showIn = o.xray || o.hide,
    showProps = o.props !== false;
  G.secs.forEach(q => {
    if (q.panel) return;
    if (q.noBack) {
      const yb0 = q.desk ? 0 : q.Pq + tc;
      push(
        `<polygon points="${pp([[q.xa, yb0], [q.xb, yb0], ...q.topPts.slice().reverse()])}" style="fill:var(--wall)"/><polygon points="${pp([[q.xa, yb0], [q.xb, yb0], ...q.topPts.slice().reverse()])}" style="fill:var(--shade)" opacity=".45"/>`
      );
    } else
      q.backPieces.forEach(bp =>
        push(
          `<polygon points="${pp(bp.poly)}" fill="${pvF(bp.fin || M.back.fin)}"/><polygon points="${pp(bp.poly)}" style="fill:var(--shade)"/>`
        )
      );
    const sb = q.grp && q.grp.ko === 0;
    if (!q.desk && !(sb && q.follow != null)) {
      const x1 = sb ? q.grp.members[q.grp.members.length - 1].xb : q.xb;
      push(
        `<rect x="${q.xa}" y="${Y(q.Pq + tc)}" width="${x1 - q.xa}" height="${tc}" fill="${q.dren ? phF(q.dren) : ph('carcass')}"/>`
      );
    }
    if (q.legs) {
      const lf = q.legs.fin;
      q.legs.xs.forEach(x =>
        push(
          `<polygon points="${pp([
            [x, q.Pq],
            [x + q.legs.lw, q.Pq],
            [x + q.legs.lw * 0.75, 0],
            [x + q.legs.lw * 0.25, 0]
          ])}" fill="${pvF(lf)}" stroke="rgba(0,0,0,.35)" stroke-width="${sw * 0.6}"/>`
        )
      );
      push(
        `<ellipse cx="${(q.bL + q.bR) / 2}" cy="${Y(0)}" rx="${(q.bR - q.bL) * 0.55}" ry="14" fill="rgba(0,0,0,.12)"/>`
      );
    }
    if (q.free && q.mount === 'wall')
      push(
        `<rect x="${q.bL + 20}" y="${Y(q.Pq - 10)}" width="${q.bR - q.bL - 40}" height="40" fill="rgba(0,0,0,.10)" rx="20"/>`
      );
    if (q.dF && q.zones[0]) {
      const pq = G.secs[q.i - 1],
        yt = q.zones[0].divY;
      if (pq)
        push(
          `<rect x="${n1(pq.xb - 1)}" y="${n1(Y(yt))}" width="${n1(q.xa - pq.xb + 2)}" height="${n1(yt)}" fill="${pv('back')}"/><rect x="${n1(pq.xb - 1)}" y="${n1(Y(yt))}" width="${n1(q.xa - pq.xb + 2)}" height="${n1(yt)}" style="fill:var(--shade)"/>`
        );
    }
    if (q.desk && !q.dgEnd && (!q.dF || q.i === q.grp.last))
      push(
        `<rect x="${q.dF ? G.secs[q.grp.lead].xa : q.xa}" y="${Y(+q.s.deskH)}" width="${q.xb - (q.dF ? G.secs[q.grp.lead].xa : q.xa)}" height="${G.td}" fill="${ph('desk')}" stroke="rgba(0,0,0,.35)" stroke-width="${sw * 0.6}"/>`
      );
    if (q.desk && q.upD) {
      const z1 = q.zones[1];
      if (z1) {
        const yb_ = q.zones[0].divY,
          yt_ = Math.min(q.top(q.bL), q.top(q.bR));
        push(`<rect x="${q.xa}" y="${Y(yb_)}" width="${q.w}" height="${tc}" fill="rgba(0,0,0,.14)"/>`);
      }
    }
    push(
      `<polygon points="${pp([...q.topPts, ...q.under.slice().reverse()])}" fill="${q.dren ? phF(q.dren) : ph('carcass')}"/>`
    );
  });
  G.secs.forEach(q =>
    q.zones.forEach(zr => {
      if (!zr.passage) return;
      const y1 = zr.y0 + zr.h;
      if (zr.passage === 'open' || zr.passage === 'hallway') {
        push(`<rect x="${q.xa}" y="${Y(y1)}" width="${q.w}" height="${y1}" fill="#2B2D30" opacity=".55"/>`);
        if (zr.hall && zr.hall.leaf) {
          const lf = zr.hall.leaf;
          push(
            `<polygon points="${pp(lf.poly)}" fill="${pvF(M.front.fin)}" stroke="rgba(0,0,0,.45)" stroke-width="${sw}"/><polygon points="${pp(lf.poly)}" fill="rgba(0,0,0,.28)"/>` +
              handleSVG(lf.hs, Y, false, S.opts.handleWood)
          );
        }
      } else push(`<rect x="${q.xa}" y="${Y(y1)}" width="${q.w}" height="${y1}" fill="#2B2D30" opacity=".45"/>`);
    })
  );
  G.secs.forEach(q =>
    q.zones.forEach(zr => {
      const op = zr.open;
      if (!op) return;
      push(
        `<rect x="${op.x0}" y="${Y(op.y1)}" width="${op.x1 - op.x0}" height="${op.y1 - op.y0}" fill="${pvF(zr.inFin || M.back.fin)}"/><rect x="${op.x0}" y="${Y(op.y1)}" width="${op.x1 - op.x0}" height="${op.y1 - op.y0}" fill="rgba(0,0,0,.22)"/>`
      );
    })
  );
  G.secs.forEach(q =>
    q.zones.forEach(zr => {
      if (zr.divIv)
        push(
          `<rect x="${zr.divIv[0]}" y="${Y(zr.divY + zr.divT)}" width="${zr.divIv[1] - zr.divIv[0]}" height="${zr.divT}" fill="${zr.divFin ? phF(zr.divFin) : ph('carcass')}" stroke="rgba(0,0,0,.25)" stroke-width="${sw * 0.5}"/>`
        );
      const pk = o.peek && o.peek[0] === q.i && o.peek[1] === zr.k,
        vis = zr.z.type === 'open' || showIn || pk || zr.glass;
      if (vis || (q.desk && zr.k === 0))
        (zr.cIns || []).forEach(c => {
          const f = FIN[c.fin] ? c.fin : 'ral9010';
          push(
            `<polygon points="${pp(c.poly)}" fill="${pvF(f)}"/>` +
              (c.kind === 'peg'
                ? `<polygon points="${pp(c.poly)}" fill="url(#peg)"/>`
                : c.kind === 'mirror'
                  ? `<polygon points="${pp(c.poly)}" fill="url(#mirrg)" opacity=".9"/>`
                  : '')
          );
        });
      if (vis)
        zr.shelvesY.forEach(([y, l, r]) =>
          push(
            `<rect x="${l}" y="${Y(y + G.ts)}" width="${r - l}" height="${G.ts}" fill="${phF(zr.inFin || M.shelf.fin)}" stroke="rgba(0,0,0,.25)" stroke-width="${sw * 0.5}"/>`
          )
        );
      // the front rail standing on a header / level board takes the bottom of this level (shelves are spaced above it)
      if (vis)
        (G.hRails || [])
          .filter(r_ => !r_.rear && Math.abs(r_.y0 - zr.y0) < 1 && r_.xb > q.xa + 5 && r_.xa < q.xb - 5)
          .forEach(r_ =>
            push(
              `<rect x="${r_.xa}" y="${Y(r_.y1)}" width="${r_.xb - r_.xa}" height="${r_.y1 - r_.y0}" fill="${ph('carcass')}" stroke="rgba(0,0,0,.3)" stroke-width="${sw * 0.5}"><title>Header rail ${f0(r_.y1 - r_.y0)} mm — shelves are spaced above it</title></rect>`
            )
          );
      if (vis)
        (G.vdivs || [])
          .filter(d => d.sec === q.i && d.zone === zr.k)
          .forEach(d =>
            push(
              `<rect x="${d.x}" y="${Y(d.y1)}" width="${G.tc}" height="${d.y1 - d.y0}" fill="${d.fin ? phF(d.fin) : ph('carcass')}" stroke="rgba(0,0,0,.3)" stroke-width="${sw * 0.5}"/>`
            )
          );
      if (zr.railY && (showIn || pk))
        (zr.railComps && zr.railComps.length ? zr.railComps : [[q.xa, q.xb]]).forEach(rc_ =>
          [zr.railY, zr.rail2Y]
            .filter(y => y > 0)
            .forEach(y =>
              push(
                `<line x1="${rc_[0] + 20}" x2="${rc_[1] - 20}" y1="${Y(y)}" y2="${Y(y)}" stroke="#9AA0A4" stroke-width="25" stroke-linecap="round"/>`
              )
            )
        );
      if (zr.applIn && (showIn || pk))
        zr.applIn.forEach(a =>
          push(
            `<rect x="${n1(a.x)}" y="${n1(Y(a.y + a.h))}" width="${n1(a.w)}" height="${n1(a.h)}" rx="14" fill="#F4F5F6" fill-opacity=".85" stroke="#9AA0A6" stroke-width="${n1(Math.max(2, sw))}"/>${a.h > 1300 ? `<path d="M${n1(a.x)} ${n1(Y(a.y + a.h * 0.36))}h${n1(a.w)}" stroke="#9AA0A6" stroke-width="${n1(Math.max(2, sw))}"/>` : ''}${mini ? '' : `<text x="${n1(a.x + a.w / 2)}" y="${n1(Y(a.y + a.h * 0.6))}" text-anchor="middle" font-size="${fs * 0.6}" fill="#7A8086">fridge</text>`}`
          )
        );
      if (zr.fit && (showIn || pk)) {
        const f = zr.fit,
          a = q.xa + 12,
          b = q.xb - 12,
          st = `stroke="#8E959A" stroke-width="${n1(Math.max(6, sw * 2.2))}" fill="none" stroke-linecap="round"`;
        if (f.kind === 'lift') {
          if (zr.railY) {
            const m = (a + b) / 2;
            push(
              `<path d="M${n1(a + 20)} ${n1(Y(zr.railY))}V${n1(Y(zr.railY - 260))}M${n1(b - 20)} ${n1(Y(zr.railY))}V${n1(Y(zr.railY - 260))}M${n1(m)} ${n1(Y(zr.railY))}V${n1(Y(zr.railY - 700))}" ${st}/><circle cx="${n1(m)}" cy="${n1(Y(zr.railY - 725))}" r="24" ${st}/>`
            );
          }
        } else if (f.kind === 'larder') {
          const bh = Math.min(260, (f.y1 - f.y0 - 120) / f.n - 40);
          push(
            `<path d="M${n1(a + 6)} ${n1(Y(f.y0 + 30))}V${n1(Y(f.y1 - 40))}M${n1(b - 6)} ${n1(Y(f.y0 + 30))}V${n1(Y(f.y1 - 40))}" ${st}/>`
          );
          for (let j = 0; j < f.n; j++) {
            const y0 = f.y0 + 60 + (j * (f.y1 - f.y0 - 120)) / f.n;
            push(
              `<path d="M${n1(a + 14)} ${n1(Y(y0 + bh))}V${n1(Y(y0))}H${n1(b - 14)}V${n1(Y(y0 + bh))}" stroke="#8E959A" stroke-width="${n1(Math.max(4, sw * 1.6))}" fill="#8E959A" fill-opacity=".12"/>`
            );
            for (let x = a + 60; x < b - 40; x += 60)
              push(
                `<path d="M${n1(x)} ${n1(Y(y0))}v${n1(-bh * 0.8)}" stroke="#8E959A" stroke-width="${n1(Math.max(2, sw * 0.8))}" opacity=".6"/>`
              );
          }
        } else if (!f.h) {
          const ytop = Math.min(
              zr.y0 + zr.h - 60,
              f.kind === 'valet' ? 1750 : f.kind === 'mirror' ? f.y0 + 1100 : zr.y0 + zr.h - 120
            ),
            yb = f.kind === 'mirror' ? f.y0 + 80 : ytop - (f.kind === 'valet' ? 40 : 500);
          if (f.kind === 'valet')
            push(
              `<path d="M${n1(b - 10)} ${n1(Y(ytop))}h${n1(-Math.min(320, b - a - 40))}" ${st}/><circle cx="${n1(b - 10 - Math.min(320, b - a - 40))}" cy="${n1(Y(ytop))}" r="14" fill="#8E959A"/>`
            );
          else if (f.kind === 'mirror')
            push(
              `<rect x="${n1(b - 90)}" y="${n1(Y(ytop))}" width="70" height="${n1(ytop - yb)}" rx="10" fill="#CFE0EA" stroke="#8E959A" stroke-width="${n1(Math.max(2, sw))}"/>`
            );
          else {
            push(`<path d="M${n1(b - 40)} ${n1(Y(ytop))}V${n1(Y(yb))}" ${st}/>`);
            for (let y = yb + 40; y < ytop; y += 60)
              push(`<path d="M${n1(b - 40)} ${n1(Y(y))}h-40" stroke="#8E959A" stroke-width="${n1(Math.max(2, sw))}"/>`);
          }
        } else
          for (let j = 0; j < f.n; j++) {
            const y0 = f.y0 + j * f.h + 10,
              y1 = y0 + f.h - 22;
            if (f.kind === 'trouser') {
              push(`<path d="M${n1(a)} ${n1(Y(y1))}H${n1(b)}" ${st}/>`);
              for (let x = a + 45; x < b - 20; x += 70)
                push(`<path d="M${n1(x)} ${n1(Y(y1))}V${n1(Y(y0 + 15))}" ${st}/>`);
            } else if (f.kind === 'shoe') {
              push(`<path d="M${n1(a)} ${n1(Y(y0 + 14))}H${n1(b)}" ${st}/>`);
              for (let x = a + 30; x < b - 130; x += 140)
                push(
                  `<path d="M${n1(x)} ${n1(Y(y0 + 26))}v-52q36 -26 62 14q34 6 42 38z" fill="#8E959A" opacity=".6"/>`
                );
            } else if (f.kind === 'hamper') {
              push(
                `<rect x="${n1(a + 20)}" y="${n1(Y(y1))}" width="${n1(b - a - 40)}" height="${n1(y1 - y0)}" rx="20" fill="#E9E2D3" stroke="#8E959A" stroke-width="${n1(Math.max(2, sw))}"/><path d="M${n1((a + b) / 2)} ${n1(Y(y1))}V${n1(Y(y0))}" stroke="#8E959A" stroke-width="${n1(Math.max(2, sw))}"/>`
              );
            } else if (f.kind === 'safe') {
              const w_ = Math.min(350, b - a - 40),
                x_ = (a + b) / 2 - w_ / 2;
              push(
                `<rect x="${n1(x_)}" y="${n1(Y(y1))}" width="${n1(w_)}" height="${n1(y1 - y0)}" rx="8" fill="#5B6168"/><circle cx="${n1(x_ + w_ * 0.7)}" cy="${n1(Y((y0 + y1) / 2))}" r="28" fill="#C9CDD1"/>`
              );
            } else if (f.kind === 'suitcase') {
              const w_ = Math.min(700, b - a - 60),
                x_ = a + 30;
              push(
                `<rect x="${n1(x_)}" y="${n1(Y(y1))}" width="${n1(w_)}" height="${n1(y1 - y0)}" rx="30" fill="#3F6E8C" opacity=".75"/><path d="M${n1(x_ + w_ / 2 - 60)} ${n1(Y(y1))}v-30h120v30" fill="none" stroke="#3F6E8C" stroke-width="${n1(Math.max(4, sw * 2))}"/>`
              );
            } else if (f.kind === 'ironing') {
              push(
                `<rect x="${n1(a + 8)}" y="${n1(Y(y1))}" width="${n1(b - a - 16)}" height="${n1(y1 - y0)}" fill="${ph('carcass')}" stroke="rgba(0,0,0,.45)" stroke-width="${n1(Math.max(2, sw))}"/><path d="M${n1(a + 30)} ${n1(Y((y0 + y1) / 2))}h${n1(b - a - 90)}l30 -12" stroke="#8E959A" stroke-width="${n1(Math.max(3, sw * 1.5))}" fill="none"/>`
              );
            } else if (f.kind === 'basket') {
              push(`<rect x="${n1(a)}" y="${n1(Y(y1))}" width="${n1(b - a)}" height="${n1(y1 - y0)}" rx="16" ${st}/>`);
              for (let x = a + 45; x < b - 20; x += 45)
                push(
                  `<path d="M${n1(x)} ${n1(Y(y1))}V${n1(Y(y0))}" stroke="#8E959A" stroke-width="${n1(Math.max(2, sw))}" opacity=".6"/>`
                );
            } else
              push(
                `<rect x="${n1(a + 8)}" y="${n1(Y(y1))}" width="${n1(b - a - 16)}" height="${n1(y1 - y0)}" fill="${ph('carcass')}" stroke="rgba(0,0,0,.45)" stroke-width="${n1(Math.max(2, sw))}"/><path d="M${n1((a + b) / 2 - 55)} ${n1(Y(y1))}q55 50 110 0z" fill="rgba(0,0,0,.28)"/>`
              );
          }
      }
    })
  );
  G.parts.forEach(p =>
    push(
      `<rect x="${p.x}" y="${Y(p.h)}" width="${tc}" height="${p.h - p.yb}" fill="${p.fin ? pvF(p.fin) : pv('carcass')}" stroke="rgba(0,0,0,.22)" stroke-width="${sw * 0.5}"/>`
    )
  );
  G.secs.forEach(q =>
    q.backHoles.forEach(h =>
      push(`<circle cx="${h.x}" cy="${Y(h.y)}" r="${h.d / 2}" fill="#1a1a1a" stroke="#555" stroke-width="${sw}"/>`)
    )
  );
  G.linings.forEach(L => {
    const f = L.fin || M.front.fin,
      st = `stroke="rgba(0,0,0,.35)" stroke-width="${sw * 0.7}"`;
    if (L.top) {
      const t = L.top,
        yl = t[0][1],
        yr = t[t.length - 1][1];
      push(
        `<rect x="${L.x0}" y="${Y(L.y0 + L.bt)}" width="${L.x1 - L.x0}" height="${L.bt}" fill="${phF(f)}" ${st}/><rect x="${L.x0}" y="${Y(yl - L.bt)}" width="${L.bt}" height="${yl - L.y0 - 2 * L.bt}" fill="${pvF(f)}" ${st}/><rect x="${L.x1 - L.bt}" y="${Y(yr - L.bt)}" width="${L.bt}" height="${yr - L.y0 - 2 * L.bt}" fill="${pvF(f)}" ${st}/><polygon points="${pp([...t, ...t.map(([x, y]) => [x, y - L.bt]).reverse()])}" fill="${phF(f)}" ${st}/>`
      );
      return;
    }
    push(
      `<rect x="${L.x0}" y="${Y(L.y1)}" width="${L.x1 - L.x0}" height="${L.bt}" fill="${phF(f)}" ${st}/>${L.nb ? '' : `<rect x="${L.x0}" y="${Y(L.y0 + L.bt)}" width="${L.x1 - L.x0}" height="${L.bt}" fill="${phF(f)}" ${st}/>`}<rect x="${L.x0}" y="${Y(L.y1 - L.bt)}" width="${L.bt}" height="${L.y1 - L.y0 - (L.nb ? 1 : 2) * L.bt}" fill="${pvF(f)}" ${st}/><rect x="${L.x1 - L.bt}" y="${Y(L.y1 - L.bt)}" width="${L.bt}" height="${L.y1 - L.y0 - (L.nb ? 1 : 2) * L.bt}" fill="${pvF(f)}" ${st}/>`
    );
  });
  (G.nooks || []).forEach(nk => {
    if (nk.pad) {
      const w = nk.x1 - nk.x0,
        h = nk.pad.y1 - nk.pad.y0,
        nch = Math.max(3, Math.round(w / 140));
      push(
        `<rect x="${n1(nk.x0)}" y="${n1(Y(nk.pad.y1))}" width="${n1(w)}" height="${n1(h)}" rx="10" fill="${nk.pad.col}" stroke="rgba(0,0,0,.3)" stroke-width="${sw * 0.5}"/>${Array.from({ length: nch - 1 }, (_, j) => `<line x1="${n1(nk.x0 + (w * (j + 1)) / nch)}" x2="${n1(nk.x0 + (w * (j + 1)) / nch)}" y1="${n1(Y(nk.pad.y1) + 8)}" y2="${n1(Y(nk.pad.y0) - 8)}" stroke="rgba(0,0,0,.16)" stroke-width="${sw * 0.6}"/>`).join('')}`
      );
    }
    if (nk.cubby) {
      const c = nk.cubby;
      push(
        `<rect x="${n1(c.x0)}" y="${n1(Y(c.y1))}" width="${n1(c.x1 - c.x0)}" height="${n1(c.y1 - c.y0)}" fill="rgba(20,16,12,.42)" stroke="rgba(0,0,0,.45)" stroke-width="${sw * 0.8}"/><rect x="${n1(c.x0 + 50)}" y="${n1(Y(c.y0 + 12 + 85))}" width="60" height="85" rx="8" fill="#F4EFE6" stroke="rgba(0,0,0,.35)" stroke-width="${sw * 0.4}"/>`
      );
    }
    (nk.ledges || []).forEach(y => {
      const BC = ['#E4572E', '#F3A712', '#669BBC', '#A8C686'];
      push(
        `<rect x="${n1(nk.x0)}" y="${n1(Y(y + 12))}" width="70" height="12" fill="rgba(90,70,50,.85)"/><rect x="${n1(nk.x0 + 58)}" y="${n1(Y(y + 32))}" width="12" height="20" fill="rgba(90,70,50,.85)"/>${[0, 1, 2].map(j => `<rect x="${n1(nk.x0 + 8 + j * 16)}" y="${n1(Y(y + 12 + 170 + j * 14))}" width="13" height="${170 + j * 14}" rx="2" fill="${BC[(j + Math.round(y)) % BC.length]}" stroke="rgba(0,0,0,.3)" stroke-width="${sw * 0.3}"/>`).join('')}`
      );
    });
  });
  (G.cubs || []).forEach(c => {
    if (!c.open) return;
    push(
      `<rect x="${n1(c.x0)}" y="${n1(Y(c.y1))}" width="${n1(c.x1 - c.x0)}" height="${n1(c.y1 - c.y0)}" fill="${pvF(c.fin)}"/><rect x="${n1(c.x0 + 14)}" y="${n1(Y(c.y1 - 14))}" width="${n1(c.x1 - c.x0 - 28)}" height="${n1(c.y1 - c.y0 - 28)}" fill="rgba(0,0,0,.14)"/>`
    );
  });
  if (showProps) G.props.forEach(p => push(propSVG(p, Y)));
  (G.cubs || []).forEach(c => {
    const d_ = c.open
      ? [c.poly, c.hole].map(pl => 'M' + pl.map(p_ => n1(p_[0]) + ' ' + n1(Y(p_[1]))).join('L') + 'Z').join('')
      : 'M' + c.poly.map(p_ => n1(p_[0]) + ' ' + n1(Y(p_[1]))).join('L') + 'Z';
    push(
      `<path d="${d_}" fill-rule="evenodd" fill="${pvF(c.fin)}" stroke="rgba(0,0,0,.38)" stroke-width="${sw * 0.7}"/>`
    );
  });
  (G.nooks || []).forEach(nk => {
    if (!nk.curt) return;
    const C_ = nk.curt,
      dw = C_.dw,
      yT = Y(C_.y1),
      yB = Y(C_.y0),
      dr = (a, b, dir) => {
        const n = 5,
          fw = (b - a) / n;
        let d = `M${n1(a)} ${n1(yT)}L${n1(b)} ${n1(yT)}`;
        d += `C${n1(b + dir * 18)} ${n1(yT + (yB - yT) * 0.35)} ${n1(b - dir * 14)} ${n1(yT + (yB - yT) * 0.7)} ${n1(b + dir * 6)} ${n1(yB)}`;
        d += `L${n1(a)} ${n1(yB)}Z`;
        return `<path d="${d}" fill="${C_.col}" stroke="rgba(0,0,0,.35)" stroke-width="${sw * 0.5}"/>${Array.from({ length: n - 1 }, (_, j) => `<line x1="${n1(a + fw * (j + 1))}" x2="${n1(a + fw * (j + 1) + dir * 4)}" y1="${n1(yT + 6)}" y2="${n1(yB - 6)}" stroke="rgba(0,0,0,.18)" stroke-width="${sw * 0.6}"/>`).join('')}`;
      };
    push(
      dr(C_.x0, C_.x0 + dw, 1) +
        dr(C_.x1, C_.x1 - dw, -1) +
        `<line x1="${n1(C_.x0)}" x2="${n1(C_.x1)}" y1="${n1(yT)}" y2="${n1(yT)}" stroke="rgba(0,0,0,.55)" stroke-width="${sw * 1.4}"/>`
    );
  });
  (G.baskets || []).forEach(b => {
    const w = b.x1 - b.x0,
      h = b.y1 - b.y0,
      cx = (b.x0 + b.x1) / 2;
    const gd = b.gd || 30,
      gy = Y(b.y1 - Math.min(40, h * 0.22) - gd / 2),
      off = Math.min(70, w * 0.18),
      gr =
        b.grip === 'hole'
          ? `<circle cx="${n1(cx)}" cy="${n1(gy)}" r="${gd / 2}" fill="rgba(20,16,12,.6)"/>`
          : b.grip === 'two'
            ? `<circle cx="${n1(cx - off)}" cy="${n1(gy)}" r="${gd / 2}" fill="rgba(20,16,12,.6)"/><circle cx="${n1(cx + off)}" cy="${n1(gy)}" r="${gd / 2}" fill="rgba(20,16,12,.6)"/>`
            : `<rect x="${n1(cx - Math.min(50, w * 0.25))}" y="${n1(Y(b.y1 - 40))}" width="${n1(Math.min(100, w * 0.5))}" height="30" rx="15" fill="rgba(20,16,12,.6)"/>`;
    push(
      `<rect x="${n1(b.x0)}" y="${n1(Y(b.y1))}" width="${n1(w)}" height="${n1(h)}" rx="4" fill="${pvF(b.fin)}" stroke="rgba(0,0,0,.4)" stroke-width="${sw * 0.6}"/>${gr}`
    );
  });
  (G.nooks || []).forEach(nk => {
    const P_ = nk.pod;
    if (!P_) return;
    const cy = n1(Y(P_.cy));
    push(
      `<circle cx="${n1(P_.cx)}" cy="${cy}" r="${n1(P_.r)}" fill="${pvF(P_.rim)}"/><circle cx="${n1(P_.cx)}" cy="${cy}" r="${n1(P_.r - 12)}" fill="rgba(0,0,0,.18)"/><circle cx="${n1(P_.cx)}" cy="${cy}" r="${n1(P_.r * 0.78)}" fill="${pvF(P_.rim)}" opacity=".9"/>` +
        P_.ledges
          .map(
            ([x0, x1, y]) =>
              `<rect x="${n1(x0)}" y="${n1(Y(y + 38))}" width="${n1(x1 - x0)}" height="38" fill="${pvF(P_.rim)}" stroke="rgba(0,0,0,.3)" stroke-width="${sw * 0.5}"/>`
          )
          .join('') +
        P_.ribs
          .map(
            rb => `<polygon points="${pp(rb)}" fill="${P_.fab}" stroke="rgba(0,0,0,.28)" stroke-width="${sw * 0.5}"/>`
          )
          .join('')
    );
  });
  (G.arches || []).forEach(a => {
    const d = [a.poly, ...a.holes]
      .map(pl => 'M' + pl.map(p_ => n1(p_[0]) + ' ' + n1(Y(p_[1]))).join('L') + 'Z')
      .join('');
    push(
      `<path d="${d}" fill-rule="evenodd" fill="${pvF(a.fin)}" stroke="rgba(0,0,0,.35)" stroke-width="${sw * 0.6}"/>`
    );
    if (a.bed) {
      const xs = a.poly.map(p_ => p_[0]),
        ys = a.poly.map(p_ => p_[1]),
        x0 = Math.min(...xs),
        x1 = Math.max(...xs),
        y0 = Math.min(...ys),
        y1 = Math.max(...ys),
        cx = (x0 + x1) / 2;
      push(
        `<path d="M${n1(cx)} ${n1(Y(y1 - 20))}V${n1(Y(y0 + 20))}" stroke="rgba(0,0,0,.35)" stroke-width="${sw * 1.2}"/><rect x="${n1(cx - 160)}" y="${n1(Y(y1 - 260))}" width="320" height="40" rx="20" fill="rgba(0,0,0,.28)"/>`
      );
      if (!mini)
        push(
          `<text x="${n1(cx)}" y="${n1(Y((y0 + y1) / 2))}" text-anchor="middle" font-size="${fs * 0.8}" fill="rgba(0,0,0,.45)">fold-down bed</text>`
        );
    }
  });
  G.secs.forEach(q =>
    q.zones.forEach(zr =>
      (zr.appl || []).forEach(a => {
        if (a.k === 'oven') {
          const sw2 = n1(Math.max(2, sw));
          push(
            `<rect x="${n1(a.x)}" y="${n1(Y(a.y + a.h))}" width="${a.w}" height="${n1(a.h)}" rx="10" fill="#2B2F33" stroke="#9AA0A6" stroke-width="${sw2}"/><rect x="${n1(a.x + 12)}" y="${n1(Y(a.y + a.h - 12))}" width="${a.w - 24}" height="${n1(Math.min(90, a.h * 0.18))}" rx="6" fill="#C9CDD1"/><rect x="${n1(a.x + 50)}" y="${n1(Y(a.y + a.h * 0.72))}" width="${a.w - 100}" height="${n1(a.h * 0.55)}" rx="16" fill="#14171A" stroke="#5B6168" stroke-width="${sw2}"/><path d="M${n1(a.x + 70)} ${n1(Y(a.y + a.h * 0.77))}h${a.w - 140}" stroke="#C9CDD1" stroke-width="${n1(Math.max(6, sw * 2.5))}" stroke-linecap="round"/>`
          );
          if (!mini)
            push(
              `<text x="${n1(a.x + a.w / 2)}" y="${n1(Y(a.y + a.h * 0.35))}" text-anchor="middle" font-size="${fs * 0.6}" fill="#C9CDD1">oven</text>`
            );
          return;
        }
        const r_ = Math.min(a.w, a.h) * 0.3,
          cx = a.x + a.w / 2,
          cy = a.y + a.h * 0.45;
        push(
          `<rect x="${n1(a.x)}" y="${n1(Y(a.y + a.h))}" width="${a.w}" height="${a.h}" rx="18" fill="#F4F5F6" stroke="#9AA0A6" stroke-width="${n1(Math.max(2, sw))}"/><rect x="${n1(a.x + 20)}" y="${n1(Y(a.y + a.h - 20))}" width="${a.w - 40}" height="90" rx="8" fill="#E3E6E9"/><circle cx="${n1(a.x + a.w - 90)}" cy="${n1(Y(a.y + a.h - 65))}" r="26" fill="#C9CDD1"/><circle cx="${n1(cx)}" cy="${n1(Y(cy))}" r="${n1(r_)}" fill="${a.k === 'washer' ? '#B9C7D2' : '#D7DCE0'}" stroke="#9AA0A6" stroke-width="${n1(Math.max(4, sw * 2))}"/><circle cx="${n1(cx)}" cy="${n1(Y(cy))}" r="${n1(r_ * 0.7)}" fill="${a.k === 'washer' ? '#8FA6B8' : '#C2C8CD'}"/>`
        );
        if (!mini)
          push(
            `<text x="${n1(cx)}" y="${n1(Y(a.y + 40))}" text-anchor="middle" font-size="${fs * 0.6}" fill="#7A8086">${a.k === 'washer' ? 'washer' : 'dryer'}</text>`
          );
      })
    )
  );
  (G.nooks || []).forEach(nk => {
    const P_ = nk.pod;
    if (!P_) return;
    const cy = Y(P_.cy),
      R1 = P_.r + P_.rw,
      R0 = P_.r;
    push(
      `<path d="M${n1(P_.cx - R1)} ${n1(cy)}a${R1} ${R1} 0 1 0 ${2 * R1} 0a${R1} ${R1} 0 1 0 ${-2 * R1} 0Z M${n1(P_.cx - R0)} ${n1(cy)}a${R0} ${R0} 0 1 1 ${2 * R0} 0a${R0} ${R0} 0 1 1 ${-2 * R0} 0Z" fill-rule="evenodd" fill="${pvF(P_.rim)}" stroke="rgba(0,0,0,.4)" stroke-width="${sw * 0.8}"/>`
    );
  });
  G.secs.forEach(q =>
    q.zones.forEach(zr => {
      const pk_ = o.peek && o.peek[0] === q.i && o.peek[1] === zr.k;
      if (!(zr.glass || zr.nicheLight || (zr.glowIn && (pk_ || showIn)) || (q.desk && zr.k === 0 && q.s.deskLED)))
        return;
      const y1 = zr.top ? Math.min(...q.under.map(p => p[1])) : zr.y0 + zr.h,
        h = Math.min(y1 - zr.y0, zr.glass ? y1 - zr.y0 : 520);
      push(
        `<rect x="${q.xa}" y="${Y(y1)}" width="${q.w}" height="${h}" fill="url(#ledg)"/><rect x="${q.xa + 20}" y="${Y(y1)}" width="${q.w - 40}" height="6" fill="#FFF3D6"/>`
      );
    })
  );
  G.secs.forEach(q =>
    q.zones.forEach(zr => {
      if (!zr.open) return;
      if (zr.nook && zr.open) {
        const o = zr.open;
        push(
          `<rect x="${n1(o.ix0)}" y="${n1(Y(o.iy1))}" width="${n1(o.ix1 - o.ix0)}" height="${n1((o.iy1 - o.iy0) * 0.55)}" fill="#FFD08A" opacity=".16"/><rect x="${n1(o.ix0 + 30)}" y="${n1(Y(o.iy1) + 4)}" width="${n1(o.ix1 - o.ix0 - 60)}" height="8" rx="4" fill="#FFD08A"/>`
        );
      }
      if (zr.dj && zr.led) {
        const o = zr.open;
        push(
          `<rect x="${n1(o.ix0)}" y="${n1(Y(o.iy1))}" width="${n1(o.ix1 - o.ix0)}" height="${n1((o.iy1 - o.iy0) * 0.6)}" fill="${zr.ledCol}" opacity=".14"/><rect x="${n1(o.ix0 + 10)}" y="${n1(Y(o.iy1) + 4)}" width="${n1(o.ix1 - o.ix0 - 20)}" height="9" rx="4" fill="${zr.ledCol}"/>`
        );
      }
      if (zr.tv && zr.tv.look === 'art') {
        const t = zr.tv;
        push(
          `<rect x="${n1(t.x + 8)}" y="${n1(Y(t.y + t.h) + 10)}" width="${n1(t.w)}" height="${n1(t.h)}" fill="rgba(0,0,0,.18)"/><svg x="${n1(t.x)}" y="${n1(Y(t.y + t.h))}" width="${n1(t.w)}" height="${n1(t.h)}" viewBox="0 0 ${n1(t.w)} ${n1(t.h)}">${artInner(t.w, t.h, t.style, t.frame, t.seed)}</svg>`
        );
      } else if (zr.tv) {
        const t = zr.tv;
        push(
          `<rect x="${t.x}" y="${Y(t.y + t.h)}" width="${t.w}" height="${t.h}" rx="10" fill="url(#tvg)" stroke="#000" stroke-width="${sw * 1.2}"/>`
        );
        if (!mini)
          push(
            `<text x="${t.x + t.w / 2}" y="${Y(t.y + t.h / 2)}" text-anchor="middle" dominant-baseline="middle" font-size="${fs * 0.8}" fill="#9AA6B2">${zr.z.tv}″ · ${f0(t.w)}×${f0(t.h)}</text>`
          );
      }
      if (!mini && zr.headerNote)
        push(
          `<text x="${(zr.open.x0 + zr.open.x1) / 2}" y="${Y(zr.open.y1) + fs * 1.05}" text-anchor="middle" font-size="${fs * 0.62}" style="fill:var(--accent)">▲ ${esc(zr.headerNote)}</text>`
        );
    })
  );
  G.secs.forEach(q => {
    if (q.desk && !q.dF && !mini && !showProps)
      push(
        `<text x="${(q.xa + (q.dgEnd || q.xb)) / 2}" y="${Y(+q.s.deskH / 2)}" text-anchor="middle" font-size="${fs * 0.75}" style="fill:var(--ink2)">knee space</text>`
      );
  });
  G.plinthW.forEach(([a, b]) =>
    push(
      `<rect x="${a}" y="${Y(P)}" width="${b - a}" height="${P}" fill="${ph('skirt')}"/><rect x="${a}" y="${Y(P)}" width="${b - a}" height="${P}" style="fill:var(--shade)"/>`
    )
  );
  if (G.site && G.site.fD) {
    const fl = G.site.flo;
    G.plinthW.forEach(([a, b]) => {
      const pts = pp([
        [a, 0],
        [b, 0],
        [b, -fl(b)],
        [a, -fl(a)]
      ]);
      push(`<polygon points="${pts}" fill="${ph('skirt')}"/><polygon points="${pts}" style="fill:var(--shade)"/>`);
    });
    if (!mini)
      push(
        `<path d="M${n1(-fs)} ${n1(Y(-fl(0)))}L${n1(W + fs)} ${n1(Y(-fl(W)))}" stroke="#B4532A" stroke-width="${n1(sw * 2)}" stroke-dasharray="${n1(sw * 8)} ${n1(sw * 5)}" fill="none"/><text x="${n1(G.site.fD > 0 ? -fs * 0.4 : W + fs * 0.4)}" y="${n1(Y(-fl(G.site.fD > 0 ? 0 : W)) + fs * 0.85)}" font-size="${n1(fs * 0.6)}" fill="#B4532A" text-anchor="${G.site.fD > 0 ? 'end' : 'start'}">floor −${f0(Math.abs(G.site.fD))}</text>`
      );
  }
  G.claddings.forEach(c => {
    push(`<polygon points="${pp(c.poly)}" fill="${pvF(c.fin)}" stroke="rgba(0,0,0,.4)" stroke-width="${sw * 0.8}"/>`);
    if (c.handle && c.handle.type !== 'none') {
      try {
        push(handleSVG(c.handle, Y, false, S.opts.handleWood));
      } catch (e) {
        oops('elevation #2', e);
      }
    }
    if (c.kind === 'hatch') {
      const xs = c.poly.map(p => p[0]),
        ys = c.poly.map(p => p[1]);
      push(
        `<rect x="${Math.min(...xs) + 12}" y="${Y(Math.max(...ys) - 12)}" width="${Math.max(...xs) - Math.min(...xs) - 24}" height="${Math.max(...ys) - Math.min(...ys) - 24}" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="${sw * 0.6}" stroke-dasharray="${sw * 6} ${sw * 4}"/>`
      );
      c.holes.forEach(h => push(`<circle cx="${h.x}" cy="${Y(h.y)}" r="15" fill="#141414"/>`));
    }
  });
  G.funs.forEach(f => push(funSVG(f, Y)));
  G.funs.forEach(f => {
    if (f.k === 'chalk') {
      const w = f.x1 - f.x0,
        h = f.y1 - f.y0,
        X = v => f.x0 + v * w,
        Yy = v => Y(f.y0 + v * h);
      push(
        `<rect x="${f.x0}" y="${Y(f.y1)}" width="${w}" height="${h}" rx="6" fill="#26332D" stroke="#B9A07A" stroke-width="10"/><g fill="none" stroke="#EDEBE4" stroke-width="7" stroke-linecap="round" opacity=".85"><circle cx="${X(0.78)}" cy="${Yy(0.78)}" r="${Math.min(w, h) * 0.09}"/><path d="M${X(0.15)} ${Yy(0.2)} L${X(0.15)} ${Yy(0.45)} L${X(0.32)} ${Yy(0.6)} L${X(0.49)} ${Yy(0.45)} L${X(0.49)} ${Yy(0.2)} Z"/><path d="M${X(0.12)} ${Yy(0.82)} q${w * 0.06} ${-h * 0.08} ${w * 0.12} 0 t${w * 0.12} 0 t${w * 0.12} 0"/><path d="M${X(0.6)} ${Yy(0.25)} l${w * 0.04} ${-h * 0.08} l${w * 0.04} ${h * 0.08} l${w * 0.04} ${-h * 0.08}"/></g>`
      );
    }
    if (f.k === 'magnet') {
      const w = f.x1 - f.x0,
        h = f.y1 - f.y0;
      let m = `<rect x="${f.x0}" y="${Y(f.y1)}" width="${w}" height="${h}" rx="6" fill="#3A3F44" stroke="#9AA0A4" stroke-width="8"/>`;
      const r = prng(Math.round(f.x0));
      'ABC123'.split('').forEach((ch, i) => {
        m += `<text x="${f.x0 + w * (0.12 + r() * 0.76)}" y="${Y(f.y0 + h * (0.15 + r() * 0.7))}" font-size="${Math.min(w, h) * 0.14}" font-family="Instrument Sans, sans-serif" font-weight="700" fill="${HOLDC[i % HOLDC.length]}" text-anchor="middle">${ch}</text>`;
      });
      push(m);
    }
    if (f.k === 'peg')
      push(`<rect x="${f.x0}" y="${Y(f.y1)}" width="${f.x1 - f.x0}" height="${f.y1 - f.y0}" fill="url(#peg)"/>`);
    if (f.k === 'chart') {
      let m = `<rect x="${f.x}" y="${Y(f.y1)}" width="70" height="${f.y1 - f.y0}" fill="#F4EFE3" stroke="rgba(0,0,0,.2)" stroke-width="2"/>`;
      for (let y = 100; y <= f.y1; y += 50) {
        const big = y % 500 === 0,
          mid = y % 100 === 0;
        m += `<line x1="${f.x}" x2="${f.x + (big ? 50 : mid ? 32 : 16)}" y1="${Y(y)}" y2="${Y(y)}" stroke="#3A3A38" stroke-width="${big ? 5 : 3}"/>`;
        if (mid && !big) m += `<text x="${f.x + 40}" y="${Y(y) + 8}" font-size="22" fill="#3A3A38">${y / 10}</text>`;
        if (big)
          m += `<text x="${f.x + 56}" y="${Y(y) + 10}" font-size="30" font-weight="700" fill="${HOLDC[(y / 500) % HOLDC.length]}">${y / 10}</text>`;
      }
      push(m);
    }
  });
  G.holds.forEach(hd => {
    const sh =
      hd.shape === 0
        ? `<ellipse cx="0" cy="0" rx="${hd.s / 2}" ry="${hd.s / 3}"/>`
        : hd.shape === 1
          ? `<path d="M${-hd.s / 2} ${hd.s / 5} Q0 ${-hd.s / 1.6} ${hd.s / 2} ${hd.s / 5} Z"/>`
          : `<path d="M${-hd.s / 2.4} 0 L0 ${-hd.s / 2.2} L${hd.s / 2.4} ${hd.s / 6} L${-hd.s / 6} ${hd.s / 2.4} Z" stroke-linejoin="round" stroke-width="10" stroke="${hd.col}"/>`;
    push(
      `<g transform="translate(${n1(hd.x)} ${n1(Y(hd.y))}) rotate(${n1(hd.rot)})" fill="${hd.col}" stroke="rgba(0,0,0,.3)" stroke-width="3">${sh}<circle r="6" fill="#2A2A2A" stroke="none"/></g>`
    );
  });
  if (!o.hide) {
    const op0 = o.xray ? 0.3 : 1;
    G.fronts.forEach(f => {
      const op = o.peek && o.peek[0] === f.sec && (o.peek[1] === f.zone || f.zone === -1) ? 0.22 : op0,
        fin = f.fin || M.front.fin,
        pat = f.fabric ? `url(#fab-${f.fabric})` : f.kind === 'drawer' ? phF(fin) : pvF(fin);
      if (f.face === 'glass' && f.inner)
        push(
          `<g opacity="${op}"><path d="M${f.poly.map(p => n1(p[0]) + ' ' + n1(Y(p[1]))).join('L')}Z M${f.inner.map(p => n1(p[0]) + ' ' + n1(Y(p[1]))).join('L')}Z" fill-rule="evenodd" fill="${pat}" stroke="rgba(0,0,0,.4)" stroke-width="${sw * 0.8}"/><polygon points="${pp(f.inner)}" fill="url(#glassf)" stroke="rgba(0,0,0,.25)" stroke-width="${sw * 0.5}"/>`
        );
      else if (f.slats)
        push(
          `<g opacity="${op}"><polygon points="${pp(f.poly)}" fill="rgba(22,18,14,.42)"/>${f.slats.map(sp => `<polygon points="${pp(sp)}" fill="${pat}" stroke="rgba(0,0,0,.4)" stroke-width="${sw * 0.5}"/>`).join('')}`
        );
      else
        push(
          `<g opacity="${op}"><polygon points="${pp(f.poly)}" fill="${pat}" stroke="rgba(0,0,0,.4)" stroke-width="${sw * 0.8}"/>${!f.fabric && M.front.type === 'mdfmicro' ? `<polygon points="${pp(f.poly)}" fill="url(#microfx)"/>` : ''}`
        );
      if (f.face === 'fluted') push(`<polygon points="${pp(f.poly)}" fill="url(#flute)"/>`);
      if (f.face === 'curtain') {
        const tp = f.poly.slice(2).map(([x, y]) => [x, y + 10]);
        push(
          `<polygon points="${pp(f.poly)}" fill="url(#folds)"/><polyline points="${pp(tp)}" fill="none" stroke="#2A2C2E" stroke-width="16" stroke-linecap="round"/>`
        );
      }
      if (f.face === 'cane' && f.inner)
        push(
          `<polygon points="${pp(f.inner)}" fill="url(#cane)" stroke="rgba(0,0,0,.35)" stroke-width="${sw * 0.6}"/>`
        );
      if (f.inset)
        push(`<polygon points="${pp(f.poly)}" fill="none" stroke="rgba(0,0,0,.28)" stroke-width="${sw * 1.6}"/>`);
      if (f.rear) push(`<polygon points="${pp(f.poly)}" fill="rgba(0,0,0,.12)"/>`);
      const dark = lum(f.fabric ? FABRICS[f.fabric].c : FIN[fin].base) < 0.45;
      if (f.dots)
        push(
          f.dots
            .map(
              ([x_, y_, d_]) =>
                `<circle cx="${n1(x_)}" cy="${n1(Y(y_))}" r="${(d_ || f.dotD || 25) / 2}" fill="#141414"/>`
            )
            .join('')
        );
      if (f.handle) push(handleSVG(f.handle, Y, dark, S.opts.handleWood));
      if (f.kind === 'baffle')
        f.holes.forEach(h =>
          push(
            f.grille
              ? `<circle cx="${h.x}" cy="${Y(h.y)}" r="${h.d / 2}" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="${sw}"/>`
              : `<circle cx="${h.x}" cy="${Y(h.y)}" r="${h.d / 2}" fill="#161718"/><circle cx="${h.x}" cy="${Y(h.y)}" r="${h.d * 0.42}" fill="none" stroke="#3a3d40" stroke-width="${h.d * 0.06}"/><circle cx="${h.x}" cy="${Y(h.y)}" r="${h.d * 0.14}" fill="#2c2f31"/>`
          )
        );
      push(`</g>`);
    });
  }
  const drawLadder = () => {
    const L_ = G.ladder;
    if (!L_) return;
    const rw = `stroke="#7F858B" stroke-width="22" stroke-linecap="round"`;
    push(
      `<line x1="${n1(L_.r0)}" x2="${n1(L_.r1)}" y1="${n1(Y(L_.h))}" y2="${n1(Y(L_.h))}" ${rw}/>` +
        [L_.r0, L_.r1]
          .map(x => `<rect x="${n1(x - 14)}" y="${n1(Y(L_.h) - 22)}" width="28" height="44" rx="6" fill="#5E646A"/>`)
          .join('')
    );
    const wd = WOODS[(S.ladder || {}).wood || 'oak'] || WOODS.oak,
      x0 = L_.x,
      x1 = L_.x + L_.w,
      st = `fill="${wd.c}" stroke="${wd.d}" stroke-width="3"`;
    for (let y = 280; y < L_.h - 120; y += 280)
      push(`<rect x="${n1(x0 + 30)}" y="${n1(Y(y) - 14)}" width="${n1(L_.w - 60)}" height="28" rx="6" ${st}/>`);
    push(
      `<rect x="${n1(x0)}" y="${n1(Y(L_.h + 60))}" width="46" height="${n1(L_.h + 60)}" rx="10" ${st}/><rect x="${n1(x1 - 46)}" y="${n1(Y(L_.h + 60))}" width="46" height="${n1(L_.h + 60)}" rx="10" ${st}/>`
    );
    [x0 + 23, x1 - 23].forEach(x =>
      push(
        `<circle cx="${n1(x)}" cy="${n1(Y(L_.h))}" r="20" fill="#3E4246"/><circle cx="${n1(x)}" cy="${n1(Y(0) - 18)}" r="18" fill="#2B2D30"/>`
      )
    );
  };
  G.skirtW.forEach(p =>
    push(
      `<polygon points="${pp(p)}" fill="${ph('skirt')}" stroke="rgba(0,0,0,.35)" stroke-width="${sw * 0.7}"/>${M.skirt.type === 'mdfmicro' ? `<polygon points="${pp(p)}" fill="url(#microfx)"/>` : ''}`
    )
  );
  if (!o.hide)
    G.secs.forEach(q => {
      if (q.deskShut && q.deskDoorB)
        push(
          `<rect x="${n1(q.xa)}" y="${n1(Y(q.deskDoorB))}" width="${n1(q.w)}" height="${n1(q.deskDoorB)}" fill="#2A2C2E" fill-opacity=".55"/>`
        );
    });
  G.sideW.forEach(p =>
    push(
      `<polygon points="${pp(p)}" fill="${pv('skirt')}" stroke="rgba(0,0,0,.35)" stroke-width="${sw * 0.7}"/>${M.skirt.type === 'mdfmicro' ? `<polygon points="${pp(p)}" fill="url(#microfx)"/>` : ''}`
    )
  );
  drawLadder();
  ['L', 'R'].forEach(sd => {
    const c = CRN[sd];
    if (!c || !c.dproj) return;
    const d = c.dproj,
      a0 = sd === 'L' ? d.x0 : W + d.x0,
      a1 = sd === 'L' ? d.x1 : W + d.x1,
      x0 = Math.min(a0, a1),
      x1 = Math.max(a0, a1),
      Pl = G.P || 0,
      top = Math.max(Pl + 300, Math.min(d.h - (+S.skirt.top || 40), Pl + 2400)),
      nD = d.front > 650 ? 2 : 1,
      fill = pv('front');
    push(
      `<g opacity=".75"><rect x="${n1(x0)}" y="${n1(Y(top))}" width="${n1(x1 - x0)}" height="${n1(top - Pl)}" fill="${fill}" stroke="rgba(0,0,0,.45)" stroke-width="${sw}" stroke-dasharray="${n1(fs * 0.5)} ${n1(fs * 0.3)}"/>${nD > 1 ? `<path d="M${n1((x0 + x1) / 2)} ${n1(Y(top))}V${n1(Y(Pl))}" stroke="rgba(0,0,0,.45)" stroke-width="${sw}"/>` : ''}<rect x="${n1(x0)}" y="${n1(Y(Pl))}" width="${n1(x1 - x0)}" height="${n1(Pl)}" fill="${pv('skirt')}" opacity=".8"/></g>`
    );
    if (!mini)
      push(
        `<text x="${n1((x0 + x1) / 2)}" y="${n1(Y(top) - fs * 0.5)}" text-anchor="middle" font-size="${fs * 0.62}" style="fill:var(--ink2)">corner cabinet · seen at an angle · front ${f0(d.front)}</text>`
      );
  });
  (G.bumps || []).forEach(b => {
    const top = b.h || Math.max(...G.cps.map(p_ => p_.y));
    push(
      `<rect x="${n1(b.x)}" y="${n1(Y(top))}" width="${n1(b.w)}" height="${n1(top)}" fill="none" stroke="#7A5C3E" stroke-width="${n1(Math.max(3, sw * 1.4))}" stroke-dasharray="${n1(fs * 0.6)} ${n1(fs * 0.4)}"/>`
    );
    if (!mini)
      push(
        `<text x="${n1(b.x + b.w / 2)}" y="${n1(Y(Math.min(top, 1400)))}" text-anchor="middle" font-size="${fs * 0.62}" fill="#7A5C3E">${BUMPS[b.t].toLowerCase()} · ${f0(b.d)} deep</text>`
      );
  });
  if (!mini)
    (G.cobjs || []).forEach(o => {
      if (o.t === 'dormer') {
        if (o.sill > 0)
          push(
            `<path d="M${n1(o.x)} ${n1(Y(o.sill))}H${n1(o.x + o.w)}" stroke="#2F6FA8" stroke-width="${n1(Math.max(3, sw * 1.4))}" stroke-dasharray="${n1(fs * 0.5)} ${n1(fs * 0.3)}"/><text x="${n1(o.x + o.w / 2)}" y="${n1(Y(o.sill) - fs * 0.4)}" text-anchor="middle" font-size="${fs * 0.62}" fill="#2F6FA8">dormer sill ${f0(o.sill)}</text>`
          );
        return;
      }
      const cx = o.t === 'hatch' ? o.x + o.w / 2 : o.x,
        cy = G.ceilAt(Math.max(0, Math.min(G.W, cx))),
        c = o.t === 'smoke' ? '#C2410C' : '#2F6FA8',
        lb = { light: 'light', smoke: 'smoke detector', hatch: 'loft hatch' }[o.t];
      push(
        `<g><circle cx="${n1(cx)}" cy="${n1(Y(cy) - fs * 0.9)}" r="${n1(fs * 0.45)}" fill="none" stroke="${c}" stroke-width="${n1(Math.max(3, sw * 1.4))}"/><text x="${n1(cx)}" y="${n1(Y(cy) - fs * 1.6)}" text-anchor="middle" font-size="${fs * 0.58}" fill="${c}">${lb} · ${f0(o.d)} out</text></g>`
      );
    });
  if (!mini && G.site)
    G.site.wobs.forEach(o => {
      if ((WOB[o.t] || {}).keep)
        push(
          `<text x="${n1(o.cx)}" y="${n1(Y(o.y1) - fs * 0.3)}" text-anchor="middle" font-size="${fs * 0.6}" fill="${o.bad ? '#C2410C' : '#2F6FA8'}">${esc(WOB[o.t].n.toLowerCase())} · keep reachable</text>`
        );
    });
  if (!mini && G.site)
    G.site.wobs.forEach(o => {
      const c = o.bad ? '#C2410C' : '#2F6FA8',
        st = `fill="rgba(255,255,255,.5)" stroke="${c}" stroke-width="${n1(Math.max(3, sw * 1.6))}"`,
        top = Math.min(o.y1, G.ceilAt(Math.max(0, Math.min(W, o.cx))));
      if (o.t === 'pipe')
        push(
          `<path d="M${n1(o.cx)} ${n1(Y(0))}V${n1(Y(top))}" stroke="${c}" stroke-width="${n1(Math.max(8, o.w))}" stroke-dasharray="${n1(sw * 10)} ${n1(sw * 6)}" opacity=".75" fill="none"/>`
        );
      else if (o.t === 'radiator') {
        let r = `<rect x="${n1(o.x0)}" y="${n1(Y(o.y1))}" width="${n1(o.x1 - o.x0)}" height="${n1(o.y1 - o.y0)}" rx="12" ${st} stroke-dasharray="${n1(sw * 8)} ${n1(sw * 5)}"/>`;
        for (let x = o.x0 + 40; x < o.x1 - 20; x += 60)
          r += `<path d="M${n1(x)} ${n1(Y(o.y1 - 30))}V${n1(Y(o.y0 + 30))}" stroke="${c}" stroke-width="${n1(Math.max(2, sw))}" opacity=".7"/>`;
        push(r);
      } else
        push(
          `<rect x="${n1(o.x0)}" y="${n1(Y(o.y1))}" width="${n1(o.x1 - o.x0)}" height="${n1(o.y1 - o.y0)}" rx="10" ${st}/>` +
            (o.t === 'socket'
              ? `<circle cx="${n1(o.cx - 14)}" cy="${n1(Y(o.cy))}" r="6" fill="${c}"/><circle cx="${n1(o.cx + 14)}" cy="${n1(Y(o.cy))}" r="6" fill="${c}"/>`
              : `<rect x="${n1(o.cx - 12)}" y="${n1(Y(o.cy + 24))}" width="24" height="48" rx="4" fill="${c}"/>`)
        );
    });
  if (!mini && G.objs)
    G.objs
      .filter(o => o.wall === 'back')
      .forEach(o => {
        const isD = o.type === 'door';
        push(
          `<g><rect x="${n1(o.x)}" y="${n1(Y(o.y + o.h))}" width="${n1(o.w)}" height="${n1(o.h)}" fill="${isD ? 'rgba(150,110,70,.22)' : 'rgba(140,190,230,.32)'}" stroke="#4E6A80" stroke-width="${sw * 2}" stroke-dasharray="${sw * 9} ${sw * 5}"/>${isD ? `<circle cx="${n1(o.x + o.w - 70)}" cy="${n1(Y(1050))}" r="${sw * 5}" fill="#4E6A80"/>` : `<line x1="${n1(o.x + o.w / 2)}" x2="${n1(o.x + o.w / 2)}" y1="${n1(Y(o.y + o.h))}" y2="${n1(Y(o.y))}" stroke="#4E6A80" stroke-width="${sw}" stroke-dasharray="${sw * 4} ${sw * 4}"/>`}<text x="${n1(o.x + o.w / 2)}" y="${n1(Y(o.y + o.h) - fs * 0.4)}" text-anchor="middle" font-size="${fs * 0.62}" fill="#4E6A80">${{ window: 'window', door: 'door', roofwin: 'roof window' }[o.type] || 'window'} ${f0(o.w)}×${f0(o.h)}</text></g>`
        );
      });
  if (!mini && G.objs)
    G.objs
      .filter(o => o.wall !== 'back')
      .forEach(o => {
        const xL = o.wall === 'left' ? -fs * 0.8 : W + fs * 0.8;
        push(
          `<rect x="${n1(xL - fs * 0.25)}" y="${n1(Y(o.y + o.h))}" width="${n1(fs * 0.5)}" height="${n1(o.h)}" fill="rgba(140,190,230,.5)" stroke="#4E6A80" stroke-width="${sw}"/><text transform="translate(${n1(xL + (o.wall === 'left' ? -fs * 0.5 : fs * 0.9))} ${n1(Y(o.y + o.h / 2))}) rotate(-90)" text-anchor="middle" font-size="${fs * 0.55}" fill="#4E6A80">${o.type === 'door' ? 'door' : 'window'} in ${o.wall} wall</text>`
        );
      });
  (G.nooks || []).forEach(nk => {
    if (!nk.step) return;
    const st = nk.step;
    push(
      `<rect x="${n1(st.x0)}" y="${n1(Y(st.h))}" width="${n1(st.x1 - st.x0)}" height="${n1(st.h)}" rx="6" fill="${pvF(st.fin)}" stroke="rgba(0,0,0,.5)" stroke-width="${sw * 0.8}"/><line x1="${n1(st.x0 + 10)}" x2="${n1(st.x1 - 10)}" y1="${n1(Y(st.h) + 18)}" y2="${n1(Y(st.h) + 18)}" stroke="rgba(0,0,0,.25)" stroke-width="${sw * 0.6}"/>`
    );
  });
  if (!o.hide)
    G.fronts.forEach(f => {
      if (!f.dogCut) return;
      f.dogCut.forEach(c =>
        push(
          `<polygon points="${pp(c)}" fill="#26282A" fill-opacity=".9" stroke="rgba(0,0,0,.5)" stroke-width="${sw * 0.8}"/>`
        )
      );
      f.dogCut.slice(0, f.dog === 'double' ? 2 : 1).forEach((c, ci) => {
        const xs = c.map(p => p[0]),
          ys = c.map(p => p[1]),
          x0 = Math.min(...xs),
          x1 = Math.max(...xs),
          yb = Math.min(...ys),
          id = 'dgc' + f.sec + '_' + f.zone + '_' + ci;
        push(
          `<clipPath id="${id}"><polygon points="${pp(c)}"/></clipPath><g clip-path="url(#${id})"><rect x="${n1(x0 - 20)}" y="${n1(Y(yb + 95))}" width="${n1(x1 - x0 + 40)}" height="95" rx="40" fill="#C7B9A3"/><rect x="${n1(x0 + (x1 - x0) * 0.12)}" y="${n1(Y(yb + 135))}" width="${n1((x1 - x0) * 0.42)}" height="62" rx="30" fill="#B7A88F"/></g>`
        );
      });
    });
  if (G.screen) {
    const sc = G.screen,
      fh = sc.boxH - 4;
    push(
      `<rect x="${n1(sc.bx0 + 2)}" y="${n1(Y(sc.yT - 2))}" width="${n1(sc.bx1 - sc.bx0 - 4)}" height="${n1(fh)}" fill="${mini ? '#C9A26E' : ph('front')}" stroke="rgba(0,0,0,.5)" stroke-width="${sw}"/>`
    );
    if (sc.faux)
      sc.joints.forEach(x =>
        push(
          `<line x1="${n1(x)}" x2="${n1(x)}" y1="${n1(Y(sc.yT - 2))}" y2="${n1(Y(sc.yS + 2))}" stroke="rgba(0,0,0,.45)" stroke-width="${sw}"/>`
        )
      );
    if (!mini && !sc.down)
      push(
        `<text x="${n1(sc.xc)}" y="${n1(Y(sc.yS + sc.boxH / 2) + fs * 0.2)}" text-anchor="middle" font-size="${fs * 0.5}" fill="rgba(0,0,0,.42)">screen drawer · ${sc.diag}″</text>`
      );
    if (sc.down && !mini)
      push(
        `<g><rect x="${n1(sc.bx0 + 2)}" y="${n1(Y(sc.yS + 2))}" width="${n1(sc.bx1 - sc.bx0 - 4)}" height="${n1(Math.min(18, sc.boxH * 0.14))}" fill="rgba(0,0,0,.3)"/><rect x="${n1(sc.fx0)}" y="${n1(Y(sc.yS))}" width="${n1(sc.fx1 - sc.fx0)}" height="${n1(sc.yS - sc.imgBot + 50)}" fill="#161616" fill-opacity=".2" stroke="#161616" stroke-width="${sw * 2}"/><rect x="${n1(sc.xc - sc.w / 2)}" y="${n1(Y(sc.imgTop))}" width="${n1(sc.w)}" height="${n1(sc.h)}" fill="#F3F3EF" fill-opacity=".38" stroke="#161616" stroke-opacity=".7" stroke-width="${sw * 1.4}"/><rect x="${n1(sc.fx0 - 15)}" y="${n1(Y(sc.imgBot - 50))}" width="${n1(sc.fx1 - sc.fx0 + 30)}" height="26" rx="13" fill="#3A3A3A"/><text x="${n1(sc.xc)}" y="${n1(Y(sc.imgTop - sc.h / 2))}" text-anchor="middle" font-size="${fs * 0.8}" fill="#2A2A2A" style="paint-order:stroke" stroke="rgba(255,255,255,.75)" stroke-width="${sw * 4}">screen ${f0(sc.w)} × ${f0(sc.h)} · ${sc.diag}″</text></g>`
      );
  }
  if (!mini && G.person) {
    const pn = G.person,
      h = pn.h,
      x = pn.x,
      u = h / 1750;
    push(
      `<g opacity=".9"><rect x="${vb}" y="${n1(Y(pn.easy))}" width="${vw}" height="${n1(pn.easy - pn.low)}" fill="#3FA06A" fill-opacity=".07"/>`
    );
    [
      [pn.max, 'max reach ' + f0(pn.max), '#C2603A'],
      [pn.easy, 'easy reach ' + f0(pn.easy), '#3F8F60'],
      [pn.eye, 'eye ' + f0(pn.eye), '#5F6A72'],
      [pn.low, 'no bending above ' + f0(pn.low), '#3F8F60']
    ].forEach(([y, l, c]) =>
      push(
        `<line x1="${vb}" x2="${n1(W + mxR * 0.2)}" y1="${n1(Y(y))}" y2="${n1(Y(y))}" stroke="${c}" stroke-width="${sw * 1.3}" stroke-dasharray="${sw * 10} ${sw * 6}"/><text x="${n1(vb + fs * 0.3)}" y="${n1(Y(y) - fs * 0.25)}" font-size="${fs * 0.6}" fill="${c}" style="paint-order:stroke" stroke="rgba(255,255,255,.75)" stroke-width="${sw * 3}">${l}</text>`
      )
    );
    const R_ = (x0, y0, x1, y1, r) =>
        `<rect x="${n1(x + x0 * u)}" y="${n1(Y(y1 * u))}" width="${n1((x1 - x0) * u)}" height="${n1((y1 - y0) * u)}" rx="${n1(r * u)}"/>`,
      top = pn.max / u;
    push(
      `<g opacity=".62" fill="#3C474F">${R_(-82, 0, -14, 840, 30)}${R_(14, 0, 82, 840, 30)}${R_(-128, 800, 128, 1450, 70)}${R_(-36, 1400, 36, 1530, 20)}${R_(-178, 830, -124, 1430, 27)}${R_(124, 1330, 178, top, 27)}<circle cx="${n1(x)}" cy="${n1(Y(1628 * u))}" r="${n1(110 * u)}"/></g><circle cx="${n1(x + 151 * u)}" cy="${n1(Y(pn.max))}" r="${n1(30 * u)}" fill="#C2603A"/><text x="${n1(x)}" y="${n1(Y(-fs * 0.2) + fs * 1.2)}" text-anchor="middle" font-size="${fs * 0.6}" fill="#2F383E">${f0(h)} tall</text></g>`
    );
  }
  G.beams
    .filter(b => !G.isFull(b))
    .forEach(b => {
      const ct = Math.max(G.ceilAt(b.x), G.ceilAt(b.x + b.w));
      push(
        `<rect x="${b.x}" y="${Y(ct)}" width="${b.w}" height="${ct - b.bottom}" fill="#69737A" fill-opacity=".25" stroke="#69737A" stroke-width="${sw * 1.4}" stroke-dasharray="${sw * 8} ${sw * 5}"/>`
      );
      if (!mini)
        push(
          `<text x="${b.x + b.w / 2}" y="${Y(b.bottom) + fs * 1.1}" text-anchor="middle" font-size="${fs * 0.62}" style="fill:var(--ink2)">beam behind closing strip · ${b.depth} from wall</text>`
        );
    });
  if (!mini) {
    G.beams
      .filter(G.isFull)
      .forEach(b =>
        push(
          `<text x="${b.x + b.w / 2}" y="${Y(b.bottom) - fs * 0.5}" text-anchor="middle" font-size="${fs * 0.62}" fill="#E8ECEF" style="paint-order:stroke" stroke="#3E464B" stroke-width="${sw * 3}">steel ▾${b.bottom}</text>`
        )
      );
    const q = G.secs[o.sel];
    if (q) {
      const tl = G.sampleLine(q.top, q.bL, q.bR);
      push(
        `<polygon points="${pp([[q.bL, q.desk ? 0 : P], [q.bR, q.desk ? 0 : P], ...tl.reverse()])}" fill="none" style="stroke:var(--accent)" stroke-width="${sw * 3}" stroke-dasharray="${sw * 10} ${sw * 6}"/>`
      );
      const zr = q.zones[o.zsel];
      if (zr) {
        const ztop =
          zr.fb1 != null
            ? [
                [q.bR, zr.fb1],
                [q.bL, zr.fb1]
              ]
            : G.sampleLine(q.top, q.bL, q.bR).reverse();
        push(
          `<polygon points="${pp([[q.bL, zr.fb0], [q.bR, zr.fb0], ...ztop])}" style="fill:var(--accent)" fill-opacity=".16"/>`
        );
      }
      if (!q.panel) G._dragQ = q;
      else G._dragQ = null;
    }
    G.cps.forEach(p => {
      if (p.x >= 0 && p.x <= W)
        push(
          `<circle cx="${p.x}" cy="${Y(p.y)}" r="${sw * 4}" style="fill:var(--accent)"/><text x="${p.x}" y="${Y(p.y) - fs * 0.5}" text-anchor="${p.x < W * 0.05 ? 'start' : p.x > W * 0.95 ? 'end' : 'middle'}" font-size="${fs * 0.7}" style="fill:var(--accent)">${f0(p.y)}</text>`
        );
    });
    const dim = (a, b, y, label, small) => {
      const yy = Y(y),
        t = fs * 0.35;
      push(
        `<g style="stroke:var(--accent)" stroke-width="${sw}"><line x1="${a}" x2="${b}" y1="${yy}" y2="${yy}"/><line x1="${a}" x2="${a}" y1="${yy - t}" y2="${yy + t}"/><line x1="${b}" x2="${b}" y1="${yy - t}" y2="${yy + t}"/></g><text x="${(a + b) / 2}" y="${yy - fs * 0.3}" text-anchor="middle" font-size="${fs * (small ? 0.6 : 0.75)}" style="fill:var(--accent)">${label}</text>`
      );
    };
    const dimV = (a, b, x, label) => {
      const t = fs * 0.35;
      push(
        `<g style="stroke:var(--accent)" stroke-width="${sw}"><line x1="${x}" x2="${x}" y1="${Y(a)}" y2="${Y(b)}"/><line x1="${x - t}" x2="${x + t}" y1="${Y(a)}" y2="${Y(a)}"/><line x1="${x - t}" x2="${x + t}" y1="${Y(b)}" y2="${Y(b)}"/></g><text x="${x + fs * 0.4}" y="${Y((a + b) / 2)}" dominant-baseline="middle" font-size="${fs * 0.65}" style="fill:var(--accent)">${label}</text>`
      );
    };
    // a panel wall between two boxes has no sides of its own: its free width runs from box to box
    G.secs.forEach(q =>
      G.boxes && q.panel
        ? dim(q.bL, q.bR, -fs * 2.4, f0(q.bR - q.bL), q.bR - q.bL < fs * 3)
        : dim(q.xa, q.xb, -fs * 2.4, f0(q.w), q.w < fs * 3)
    );
    G.secs.forEach(q =>
      push(
        `<text x="${(q.xa + q.xb) / 2}" y="${Y(-fs * 4)}" text-anchor="middle" font-size="${fs * 0.9}" font-family="Instrument Sans, sans-serif" font-weight="600" style="fill:${q.i === o.sel ? 'var(--accent)' : 'var(--ink2)'}">S${q.i + 1}</text>`
      )
    );
    G.secs.forEach(q => {
      if (q.D < G.D)
        push(
          `<text x="${(q.xa + q.xb) / 2}" y="${Y(-fs * 4) + fs * 0.95}" text-anchor="middle" font-size="${fs * 0.55}" style="fill:var(--ink2)">${f0(q.D)} deep${q.z0 ? '' : ' · flush'}</text>`
        );
    });
    {
      const pts = [0, W];
      G.secs.forEach(q => {
        if (isFinite(q.bL)) pts.push(q.bL);
        if (isFinite(q.bR)) pts.push(q.bR);
      });
      const u = pts
        .sort((a, b) => a - b)
        .filter((v, i, a) => v >= -0.5 && v <= W + 0.5 && (i === 0 || v - a[i - 1] > 1));
      if (u[u.length - 1] < W - 1) u.push(W);
      for (let i = 0; i < u.length - 1; i++) {
        const a = u[i],
          b = u[i + 1];
        if (b - a > 1) dim(a, b, -fs * 5.6, f0(b - a), true);
      }
      push(
        `<text x="${n1(-fs * 0.6)}" y="${n1(Y(-fs * 2.4) + fs * 0.25)}" text-anchor="end" font-size="${fs * 0.55}" style="fill:var(--ink2)">inside</text><text x="${n1(-fs * 0.6)}" y="${n1(Y(-fs * 5.6) + fs * 0.25)}" text-anchor="end" font-size="${fs * 0.55}" style="fill:var(--ink2)">${G.boxes ? 'boxes' : 'centres'}</text>`
      );
    }
    G.secs.forEach(q =>
      (q.zones || []).forEach(zr => {
        if (!zr.dzV) return;
        const t = zr.dzV > 0 ? `▲ ${f0(zr.dzV)} out` : `▼ ${f0(-zr.dzV)} back`;
        push(
          `<g><rect x="${n1(q.xa + 12)}" y="${n1(Y(zr.y0 + zr.h - 12))}" width="${n1(fs * 4.4)}" height="${n1(fs * 0.95)}" rx="${n1(fs * 0.3)}" fill="rgba(20,20,20,.62)"/><text x="${n1(q.xa + 12 + fs * 0.3)}" y="${n1(Y(zr.y0 + zr.h - 12) + fs * 0.68)}" font-size="${n1(fs * 0.6)}" fill="#fff">${t}</text></g>`
        );
      })
    );
    dim(0, W, -fs * 7.2, `${f0(W)} wall`);
    G.secs.forEach(q => {
      if (q.pin == null) return;
      dim(0, q.lx, -fs * 8.8, `📌 ${f0(q.lx)}`);
      push(
        `<line x1="${q.lx}" x2="${q.lx}" y1="${Y(0)}" y2="${Y(-fs * 8.8)}" style="stroke:var(--accent)" stroke-width="${sw}" stroke-dasharray="${sw * 5} ${sw * 4}"/>`
      );
    });
    if (q) {
      const x = W + fs * 1.2 + exR;
      const segs = [
        [
          0,
          q.desk ? +q.s.deskH : q.Pq + tc,
          q.desk ? 'desk' : q.free ? (q.mount === 'wall' ? 'float' : q.mount === 'legs' ? 'legs' : 'base') : 'base'
        ]
      ];
      q.zones.forEach(zr =>
        segs.push([zr.y0, zr.y0 + zr.h, f0(zr.h) + (zr.top && zr.hMax - zr.hMin > 2 ? '–' + f0(zr.hMax) : '')])
      );
      segs.forEach(([a, b, l]) => dimV(a, b, x, l));
    }
    G.secs.forEach(q => {
      const tl = G.sampleLine(q.top, q.bL, q.bR);
      push(
        `<polygon data-sec="${q.i}" points="${pp([[q.bL, 0], [q.bR, 0], ...tl.reverse()])}" fill="transparent" style="cursor:pointer"/>`
      );
      q.zones.forEach(zr => {
        const ztop =
          zr.fb1 != null
            ? [
                [q.bR, zr.fb1],
                [q.bL, zr.fb1]
              ]
            : G.sampleLine(q.top, q.bL, q.bR).reverse();
        push(
          `<polygon data-sec="${q.i}" data-zone="${zr.k}" points="${pp([[q.bL, zr.fb0], [q.bR, zr.fb0], ...ztop])}" fill="transparent" style="cursor:pointer"/>`
        );
      });
    });
  }
  if (!mini && G._dragQ && G.secs[o.sel] === G._dragQ) {
    const q = G._dragQ;
    q.zones.forEach(zr => {
      if (zr.top || zr.divY == null || !q.s.zones[zr.k + 1]) return;
      const by = zr.divY + zr.divT / 2,
        mid = (q.bL + q.bR) / 2,
        gw = foc ? Math.min(190, (q.bR - q.bL) * 0.45) : Math.min(fs * 2.6, (q.bR - q.bL) * 0.4),
        hitH = foc ? 120 : fs * 1.1,
        gh = foc ? 30 : fs * 0.48;
      push(
        `<g class="zdrag" data-zd="${q.i}|${zr.k}" data-by="${n1(by)}"><rect x="${n1(q.bL)}" y="${n1(Y(by) - hitH / 2)}" width="${n1(q.bR - q.bL)}" height="${n1(hitH)}" fill="#000" fill-opacity="0"/><line class="zdl" x1="${n1(q.bL)}" x2="${n1(q.bR)}" y1="${n1(Y(by))}" y2="${n1(Y(by))}" style="stroke:var(--accent)" stroke-width="${sw * 1.5}" stroke-opacity="0"/><rect class="zdg" x="${n1(mid - gw / 2)}" y="${n1(Y(by) - gh / 2)}" width="${n1(gw)}" height="${n1(gh)}" rx="${n1(gh / 2)}" fill="#3C474F" fill-opacity=".85" stroke="#fff" stroke-width="${sw * 1.2}"/><text class="zdt" x="${n1(mid)}" y="${n1(Y(by) - fs * 0.45)}" text-anchor="middle" font-size="${fs * 0.62}" style="fill:var(--accent);display:none;paint-order:stroke" stroke="#fff" stroke-width="${sw * 3}"></text></g>`
      );
    });
  }
  // column edges of the selected column: drag sideways to make it wider or narrower (the neighbour gives or takes the difference)
  if (!mini && o.sel != null && G.secs[o.sel] && !foc) {
    const q = G.secs[o.sel];
    [
      ['l', o.sel - 1, q.bL],
      ['r', o.sel + 1, q.bR]
    ].forEach(([sd, j, bx]) => {
      const nq = G.secs[j];
      if (!nq || q.follow != null || nq.follow != null) return;
      const ht = Math.min(
          q.top(Math.max(q.bL + 1, Math.min(q.bR - 1, bx))),
          nq.top(Math.max(nq.bL + 1, Math.min(nq.bR - 1, bx)))
        ),
        hitW = fs * 1.2,
        gw = fs * 0.48,
        gh = Math.min(fs * 2.6, ht * 0.3),
        my = ht * 0.5;
      push(
        `<g class="cdrag" data-cd="${q.i}|${sd}|${j}" data-bx="${n1(bx)}"><rect x="${n1(bx - hitW / 2)}" y="${n1(Y(ht))}" width="${n1(hitW)}" height="${n1(ht)}" fill="#000" fill-opacity="0"/><line class="cdl" x1="${n1(bx)}" x2="${n1(bx)}" y1="${n1(Y(0))}" y2="${n1(Y(ht))}" style="stroke:var(--accent)" stroke-width="${sw * 1.5}" stroke-opacity="0"/><rect class="cdg" x="${n1(bx - gw / 2)}" y="${n1(Y(my) - gh / 2)}" width="${n1(gw)}" height="${n1(gh)}" rx="${n1(gw / 2)}" fill="#3C474F" fill-opacity=".85" stroke="#fff" stroke-width="${sw * 1.2}"/><text class="cdt" x="${n1(bx)}" y="${n1(Y(my) - gh / 2 - fs * 0.4)}" text-anchor="middle" font-size="${fs * 0.62}" style="fill:var(--accent);display:none;paint-order:stroke" stroke="#fff" stroke-width="${sw * 3}"></text></g>`
      );
    });
  }
  push('</svg>');
  return out.join('');
}
