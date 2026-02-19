/* ================================================
   script.js — Kajian Ramadhan
   Masjid As Sakinah Pantai Mentari
   Data source: data/kajian.json  (editable)
   ================================================ */

'use strict';

let allKajian = [];
let activeTag = 'semua';
let currentKajianId = null;
let DATA = null;

// ─── Load JSON data ──────────────────────────────
async function loadData() {
  try {
    const res = await fetch('data/kajian.json');
    DATA = await res.json();
    allKajian = DATA.kajian;

    const chBtn = document.querySelector('.yt-channel-btn');
    if (chBtn) chBtn.href = DATA.masjid.youtube_channel;

    // Featured video: prioritaskan video yang sudah ada youtube_id-nya
    const iframe = document.getElementById('featuredVideo');
    if (iframe) {
      const firstVideo = DATA.kajian.find(function (k) { return k.youtube_id; });
      if (firstVideo) {
        iframe.src = 'https://www.youtube.com/embed/' + firstVideo.youtube_id + '?rel=0&showinfo=1';
      } else if (DATA.masjid.youtube_playlist_id) {
        iframe.src = 'https://www.youtube.com/embed?listType=playlist&list='
          + DATA.masjid.youtube_playlist_id + '&index=0&rel=0';
      }
    }

    const mapsBtn = document.querySelector('.btn-social.maps');
    if (mapsBtn) mapsBtn.href = DATA.masjid.maps_url;

    renderPlaylistCards();
    renderKajianCards(allKajian);
    loadWaktuSholat();
  } catch (e) {
    console.error('Gagal memuat data kajian:', e);
  }
}

// ─── Avatar helpers ───────────────────────────────
function avatarFallbackHTML(name, size) {
  const initials = name.split(' ').slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase();
  const colors = ['#0D5C63', '#1A5276', '#4A235A', '#784212', '#1E8449', '#117A65'];
  const bg = colors[name.charCodeAt(0) % colors.length];
  return '<div class="avatar-fallback" style="width:' + size + 'px;height:' + size + 'px;background:' + bg + ';">' + initials + '</div>';
}

window.avatarFallback = function (name, size) {
  const div = document.createElement('div');
  div.innerHTML = avatarFallbackHTML(name, size);
  return div.firstChild;
};

function avatarEl(src, name, size) {
  size = size || 36;
  if (src) {
    return '<img src="' + src + '" alt="' + name + '" class="avatar-img" width="' + size + '" height="' + size
      + '" onerror="this.replaceWith(avatarFallback(\'' + name.replace(/'/g, "\\'") + '\',' + size + '))">';
  }
  return avatarFallbackHTML(name, size);
}

// ─── Playlist Cards ───────────────────────────────
function renderPlaylistCards() {
  const grid = document.getElementById('playlistGrid');
  if (!grid) return;

  grid.innerHTML = allKajian.map(function (k, i) {
    const thumb = k.youtube_id
      ? '<img src="https://img.youtube.com/vi/' + k.youtube_id + '/mqdefault.jpg" alt="' + k.judul + '" loading="lazy">'
      : '<div class="thumb-placeholder">📹</div>';
    const href = k.youtube_url || '#';

    return '<a class="playlist-card" href="' + href + '" target="_blank" rel="noopener">'
      + '<div class="playlist-thumb-wrap">' + thumb + '<div class="play-overlay">▶</div></div>'
      + '<div class="playlist-info">'
      + '<div class="playlist-ep">Ep ' + (i + 1) + ' · ' + k.ramadhan + '</div>'
      + '<div class="playlist-title">' + k.judul + '</div>'
      + '<div class="playlist-ustadz">' + k.pemateri + '</div>'
      + '<div class="playlist-ustadz" style="margin-top:2px;opacity:.7">' + k.hari + ', ' + k.tanggal + '</div>'
      + '</div></a>';
  }).join('');
}

// ─── Kajian Cards ─────────────────────────────────
function renderKajianCards(data) {
  const list = document.getElementById('kajianList');
  if (!list) return;

  if (!data.length) {
    list.innerHTML = '<div style="text-align:center;padding:40px 20px;color:var(--text-muted);grid-column:1/-1;">🔍 Kajian tidak ditemukan.</div>';
    return;
  }

  list.innerHTML = data.map(function (k) {
    const tagLabel = k.tag.charAt(0).toUpperCase() + k.tag.slice(1);
    const excerpt = (k.ringkasan.pembuka || '') + (k.ringkasan.poin_utama && k.ringkasan.poin_utama[0] ? ' ' + k.ringkasan.poin_utama[0] : '');
    return '<div class="kajian-card" data-id="' + k.id + '" data-tag="' + k.tag + '">'
      + '<div class="kajian-card-header">'
      + '<div class="kajian-number">' + k.id + '</div>'
      + '<div class="kajian-meta">'
      + '<span class="kajian-tag">' + tagLabel + '</span>'
      + '<div class="kajian-title">' + k.judul + '</div>'
      + '<div class="pemateri-row" style="display:flex;align-items:center;gap:8px;margin-top:6px;">'
      + avatarEl(k.foto_pemateri, k.pemateri, 28)
      + '<div><div class="kajian-ustadz">' + k.pemateri + '</div>'
      + '<div class="kajian-tanggal">' + k.hari + ', ' + k.tanggal + ' · ' + k.ramadhan + '</div></div>'
      + '</div></div></div>'
      + '<div class="kajian-excerpt">' + excerpt + '</div>'
      + '<div class="kajian-actions">'
      + '<button class="kajian-btn video" onclick="openSummary(' + k.id + ')">▶ Video</button>'
      + '<button class="kajian-btn summary" onclick="openSummary(' + k.id + ')">📄 Ringkasan</button>'
      + '<button class="kajian-btn infog" onclick="openInfografis(' + k.id + ')">🖼 Infografis</button>'
      + '</div></div>';
  }).join('');
}

// ─── Filter & Search ──────────────────────────────
window.filterKajian = function () {
  const q = document.getElementById('searchKajian').value.toLowerCase().trim();
  const filtered = allKajian.filter(function (k) {
    const matchTag = activeTag === 'semua' || k.tag === activeTag;
    const matchQ = !q || k.judul.toLowerCase().includes(q) || k.pemateri.toLowerCase().includes(q) || k.tag.toLowerCase().includes(q);
    return matchTag && matchQ;
  });
  renderKajianCards(filtered);
};

window.filterByTag = function (tag, btn) {
  activeTag = tag;
  document.querySelectorAll('.chip').forEach(function (c) { c.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  filterKajian();
};

// ─── Tab Switching ────────────────────────────────
window.switchTab = function (tab) {
  document.querySelectorAll('.tab-section').forEach(function (s) { s.classList.remove('active'); });
  const el = document.getElementById('tab-' + tab);
  if (el) el.classList.add('active');

  document.querySelectorAll('.tab-btn').forEach(function (b) {
    b.classList.toggle('active', b.dataset.tab === tab);
  });
  document.querySelectorAll('.bnav-btn').forEach(function (b) {
    b.classList.toggle('active', b.id === 'bnav-' + tab);
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ─── Modal: Ringkasan ─────────────────────────────
window.openSummary = function (id) {
  const k = allKajian.find(function (x) { return x.id === id; });
  if (!k) return;
  currentKajianId = id;

  document.getElementById('modalTag').textContent = k.tag.charAt(0).toUpperCase() + k.tag.slice(1);
  document.getElementById('modalTitle').textContent = k.judul;
  document.getElementById('modalMeta').innerHTML =
    '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">'
    + avatarEl(k.foto_pemateri, k.pemateri, 24)
    + '<span>' + k.pemateri + '</span>'
    + '<span style="opacity:.6">·</span>'
    + '<span style="opacity:.7">' + k.hari + ', ' + k.tanggal + '</span>'
    + '<span style="opacity:.5;font-size:.75rem">' + k.ramadhan + '</span></div>';

  let body = '<p>' + k.ringkasan.pembuka + '</p>';
  if (k.ringkasan.poin_utama && k.ringkasan.poin_utama.length) {
    body += '<h4>📌 Poin-Poin Utama</h4><ul>';
    k.ringkasan.poin_utama.forEach(function (p) { body += '<li>' + p + '</li>'; });
    body += '</ul>';
  }
  if (k.ringkasan.ayat) {
    body += '<h4>📖 Dalil</h4><div style="background:rgba(212,175,55,0.08);border-left:3px solid var(--gold);padding:10px 14px;border-radius:8px;font-style:italic;font-family:\'Amiri\',serif;font-size:1rem;line-height:1.7;margin:8px 0;">' + k.ringkasan.ayat + '</div>';
  }
  if (k.ringkasan.penutup) {
    body += '<h4>💡 Penutup</h4><p>' + k.ringkasan.penutup + '</p>';
  }

  document.getElementById('modalBody').innerHTML = body;

  const ytBtn = document.getElementById('modalYtBtn');
  const ytUrl = k.youtube_url || DATA.masjid.youtube_channel;
  ytBtn.onclick = function () { window.open(ytUrl, '_blank'); };

  openModal('summaryModal');
};

// ─── Modal: Infografis ────────────────────────────
window.openInfografis = function (id) {
  const resolvedId = id || currentKajianId;
  const k = allKajian.find(function (x) { return x.id === resolvedId; });
  if (!k) return;
  currentKajianId = resolvedId;

  document.getElementById('infogTitle').textContent = k.infografis.judul;

  const wrap = document.getElementById('infogImageWrap');
  wrap.innerHTML = '';
  const canvas = document.createElement('canvas');
  canvas.width = 540;
  canvas.height = 360;
  canvas.className = 'infog-canvas';
  wrap.appendChild(canvas);
  drawInfografis(canvas, k);

  const dlBtn = document.getElementById('infogDownloadBtn');
  dlBtn.href = canvas.toDataURL('image/png');
  dlBtn.download = 'infografis-kajian-' + k.id + '.png';

  closeModal('summaryModal');
  openModal('infogModal');
};

// ─── Canvas Infografis Generator ──────────────────
function drawInfografis(canvas, k) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const inf = k.infografis;
  const baseColor = inf.warna || '#0D5C63';

  // BG gradient
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#0A0F1E');
  grad.addColorStop(1, baseColor + '88');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Dot pattern
  ctx.fillStyle = 'rgba(212,175,55,0.06)';
  for (let x = 0; x < W; x += 30) {
    for (let y = 0; y < H; y += 30) {
      ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill();
    }
  }

  // Top bar
  const barGrad = ctx.createLinearGradient(0, 0, W, 0);
  barGrad.addColorStop(0, '#D4AF37'); barGrad.addColorStop(1, baseColor);
  ctx.fillStyle = barGrad; ctx.fillRect(0, 0, W, 6);

  // Masjid label
  ctx.font = '500 11px Inter, sans-serif';
  ctx.fillStyle = 'rgba(212,175,55,0.7)';
  ctx.textAlign = 'right';
  ctx.fillText('Masjid As Sakinah Pantai Mentari', W - 16, 28);

  // Title
  ctx.textAlign = 'center';
  ctx.font = 'bold 22px Inter, sans-serif';
  ctx.fillStyle = '#F5DEB3';
  ctx.shadowColor = 'rgba(212,175,55,0.4)'; ctx.shadowBlur = 12;
  wrapText(ctx, inf.judul, W / 2, 58, W - 60, 30);
  ctx.shadowBlur = 0;

  // Divider
  ctx.beginPath(); ctx.moveTo(60, 83); ctx.lineTo(W - 60, 83);
  ctx.strokeStyle = 'rgba(212,175,55,0.4)'; ctx.lineWidth = 1; ctx.stroke();

  // Poin list
  const startY = 108, rowH = 44;
  (inf.poin || []).forEach(function (p, i) {
    const y = startY + i * rowH;
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    roundRect(ctx, 24, y - 16, W - 48, 36, 10); ctx.fill();
    ctx.fillStyle = baseColor;
    ctx.beginPath(); ctx.arc(50, y + 2, 13, 0, Math.PI * 2); ctx.fill();
    ctx.font = 'bold 11px Inter, sans-serif'; ctx.fillStyle = '#F5DEB3'; ctx.textAlign = 'center';
    ctx.fillText(i + 1, 50, y + 6);
    ctx.font = '500 14px Inter, sans-serif'; ctx.fillStyle = '#F0EAD6'; ctx.textAlign = 'left';
    ctx.fillText(p, 74, y + 6);
  });

  // Footer
  ctx.fillStyle = 'rgba(212,175,55,0.15)'; ctx.fillRect(0, H - 36, W, 36);
  ctx.font = '500 11px Inter, sans-serif'; ctx.fillStyle = 'rgba(212,175,55,0.9)'; ctx.textAlign = 'center';
  ctx.fillText(k.pemateri, W / 2, H - 43);
  ctx.font = '12px Inter, sans-serif'; ctx.fillStyle = 'rgba(245,222,179,0.7)';
  ctx.fillText(k.hari + ', ' + k.tanggal + ' · ' + k.ramadhan, W / 2, H - 13);
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  for (let i = 0; i < words.length; i++) {
    const test = line + words[i] + ' ';
    if (ctx.measureText(test).width > maxWidth && i > 0) {
      ctx.fillText(line.trim(), x, y); line = words[i] + ' '; y += lineHeight;
    } else { line = test; }
  }
  ctx.fillText(line.trim(), x, y);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ─── Modal helpers ────────────────────────────────
window.openModal = function (id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('open');
  document.body.style.overflow = 'hidden';
};
window.closeModal = function (id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
  document.body.style.overflow = '';
};
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') { closeModal('summaryModal'); closeModal('infogModal'); }
});

// ─── FAB ─────────────────────────────────────────
window.addEventListener('scroll', function () {
  const fab = document.getElementById('fabTop');
  if (fab) fab.classList.toggle('visible', window.scrollY > 200);
}, { passive: true });

// ─── Waktu Sholat (Surabaya Ramadhan 1447H) ───────
function loadWaktuSholat() {
  const j = { imsak: '03:55', subuh: '04:05', dzuhur: '11:50', ashar: '15:06', maghrib: '17:52', isya: '19:02' };
  function set(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }
  set('wImsak', j.imsak); set('wSubuh', j.subuh); set('wDzuhur', j.dzuhur);
  set('wAshar', j.ashar); set('wMaghrib', j.maghrib); set('wIsya', j.isya);
}

// ─── Boot ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', loadData);
