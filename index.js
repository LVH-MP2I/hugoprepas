const csshugocolle = `:root {
    --accent: #9E88B6;
    --accent-dark: #8a73a4;
    --text-dark: #2c3e50;
    --bg: #f5f5f5;
    --surface: #fff;
  }
  
  body {
	display: block;
    font-family: 'Quattrocento Sans', sans-serif;
    background: var(--bg);
    margin: 0;
    padding: 1em;
    color: var(--text-dark);
  }
  
  /*main {
    background: var(--surface);
    border-radius: 16px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    margin-bottom: 1.5em;
    padding: 1em;
	width: 100%;
  }
  
  header {
    background: var(--accent);
    color: #fff;
    font-size: 1.4em;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: bold;
  }
  
  header .version {
    font-size: 0.8em;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    padding: 0.2em 0.6em;
    margin-left: 0.5em;
  }*/
  
  main h3 {
    margin-top: 0;
    font-size: 1.3em;
    font-weight: 600;
    border-left: 4px solid var(--accent);
    padding-left: 0.5em;
  }
  .table-wrapper {
	width: 100%;
	overflow-x: auto;
	-webkit-overflow-scrolling: touch;
	padding: 8px;
  }
  
  /* ---------- Fix bad inline styles first (force real table rendering) ---------- */
table.classe {
  /* allow the wrapper to scroll horizontally */
  display: table !important;      /* override inline 'display:block' */
  table-layout: auto !important;
  width: max-content;             /* expand to content width so wrapper scrolls */
  min-width: 100%;                /* but at least fit container on small content */
  border-collapse: collapse;
  overflow: visible !important;   /* table itself should not clip */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* restore semantic parts despite inline styles on tbody/tr */
table.classe thead, 
table.classe tbody {
  display: table-row-group !important;
  width: auto !important;
}

table.classe tr {
  display: table-row !important;
  width: auto !important;
}

/* Cells: prevent wrapping so wide content forces horizontal scroll */
table.classe th,
table.classe td {
  white-space: nowrap;
  padding: 8px 10px;
  border-bottom: 1px solid #eee;
  vertical-align: middle;
}

/* ---------- Scroll wrapper visual (if you use the JS wrapper below) ---------- */
.table-wrapper {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  padding: 8px;           /* optional padding around table */
}

/* ---------- Material-ish styling ---------- */
:root { --accent: #9E88B6; --accent-dark: #8a73a4; --text: #2c3e50; }

table.classe thead td {
  background: var(--accent);
  color: #fff;
  font-weight: 700;
  position: sticky;
  top: 0;                 /* header stays visible while scrolling the wrapper */
  z-index: 4;
}

table.classe td.nom {
  font-weight: 600;
  text-align: left;
  background: rgba(158,136,182,0.04);
  color: var(--text);
}

/* zebra rows & hover */
//table.classe tbody tr:nth-child(even) { background: #fafafa; }
//table.classe tbody tr:hover { background: rgba(158,136,182,0.06); transition: background .18s; }

/* ---------- Mobile tweaks (still horizontally scrollable) ---------- */
@media (max-width: 720px) {
  /* smaller paddings on small screens */
  table.classe th, table.classe td { padding: 6px 8px; font-size: 13px; }
  .table-wrapper { padding: 6px; box-shadow: none; }
  /* If you want to allow line breaks for very long text inside cells, remove the nowrap rule:
     table.classe th, table.classe td { white-space: normal; }   */
}

/* ---------- Emergency CSS to force scroll if parent clipped (override) ---------- */
.table-wrapper, table.classe {
  //max-width: 100% !important;
}


  `
export default {
	async fetch(request) {
	  const url = new URL(request.url);
	  const WORKER_BASE = url.origin;
	  const SCHOOL_ORIGIN = 'https://lyceehugobesancon.org';
  
	  // Only proxy /prepaslvh paths
	  if (url.pathname == '/prepaslvh/public/assets/css/hugocolle.css'){
		return new Response(csshugocolle, {status: 200, headers: { "Content-Type": "text/css" }})
	}
	  if (!url.pathname.startsWith('/prepaslvh')) {
		return Response.redirect(WORKER_BASE + '/prepaslvh', 302);
	  }
  
	  const target = SCHOOL_ORIGIN + url.pathname + url.search;
	  const reqInit = {
		method: request.method,
		headers: copyRequestHeadersForUpstream(request.headers),
		body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
		redirect: 'manual'
	  };
  
	  const upstreamResp = await fetch(target, reqInit);
	  const clonedHeaders = new Headers(upstreamResp.headers);
  
	  // Handle redirects manually, rewrite to Worker
	  if (upstreamResp.status >= 300 && upstreamResp.status < 400) {
		const loc = upstreamResp.headers.get('Location') || upstreamResp.headers.get('location');
		if (loc) {
		  const newLoc = rewriteLocationToWorker(loc, WORKER_BASE, SCHOOL_ORIGIN);
		  if (newLoc) clonedHeaders.set('Location', newLoc);
		}
		return new Response(await upstreamResp.text(), { status: upstreamResp.status, headers: clonedHeaders });
	  }
  
	  const contentType = upstreamResp.headers.get('content-type') || '';
	  if (contentType.toLowerCase().includes('text/html')) {
		let text = await upstreamResp.text();
		text = text.replace(/<link\b[^>]*\bhref=(["'])(?:css\/style_hugo\.css|css\/style\.css)\1[^>]*>/gi, match => "");
		if (url.pathname.startsWith('/prepaslvh/rubrique')){
			text = text.replace(/<nav\s+class=['"]navbar['"]>[\s\S]*?<\/nav>/i, match => `<nav class="sidebar-right"></nav>`)
		}
		if (url.pathname.startsWith('/prepaslvh/hugocolle')){
			//text = text.replace(/<\/head[^>]*>/i, match => `<link rel="stylesheet" href=css/hugoprepas.css>` + match);
			text = text.replace(/<nav[^>]*>[\s\S]*?<\/nav>/i, match => `
			<nav class="sidebar-right">
<ul>
<li><a href="/prepaslvh/">Accueil</a></li>
<li><a href="/prepaslvh/hugocolle/preferences">Préférences</a></li>
<li><a href="/prepaslvh/hugocolle/notes">Vos notes</a></li>
<li><a href="/prepaslvh/hugocolle/contact">Envoyer un message</a></li>
<li><a href="/prepaslvh/logout">Se déconnecter</a></li>
</ul>
</nav>
	`);
		} else {
			text = text.replace(/<nav\s+class=['"]sidebar-right['"]>/i, match => match + `<ul class="main_section">
			<li><a href="/prepaslvh/" title="Site" des="" classes="" préparatoires="" du="" lycée="" victor="" hugo="">Accueil</a></li>
			<li><a href="https://lyceehugobesancon.org">Lycée VH</a></li>
			<li><a href="/prepaslvh/question">Votre question</a></li>
			<li><a href="/prepaslvh/login">Hugocolle</a></li>
	</ul>`);
		}
  
		// Remove authentication/login overlay
		text = text.replace(/<div[^>]*id=["']auth-overlay["'][\s\S]*?<\/div>/gi, '');
		text = text.replace('<link rel="stylesheet" href=css/hugoprepas.css>', '')
		// Inject CSS + responsive navbar JS
		text = text.replace(/<\/head[^>]*>/i, match => `
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<style>
	body {
		font-family: 'Quattrocento Sans', sans-serif;
		padding: 1em;
		margin: 0;
		color: #fff; /* default text white */
		background: #111; /* fallback if image fails */
	  }
	  
	  h1, h2, h3 {
		color: #fff; /* white headings */
		margin: 0.5em 0;
	  }
	  
	  a {
		color: #bb86fc; /* bright purple accent */
		text-decoration: none;
	  }
	  
	  a:hover {
		text-decoration: underline;
		color: #fff; /* white on hover */
	  }
	  
	  table {
		width: 100%;
		font-size: 0.9em;
	  }
	  
	  img {
		max-width: 100%;
		height: auto;
	  }
	  
	  main {
		overflow-x: auto;
	  }
	  
	  .home {
		width: 100%;
	  }
	  
	  body {
		width: 100%;
		max-width: 100%;
		min-width: 0;
		padding: 10px;
		box-sizing: border-box;
		background-image: url("https://raw.githubusercontent.com/pi-dev500/pi-dev500.github.io/refs/heads/main/images/VH.jpg");
		background-repeat: no-repeat;
		background-size: cover;
		background-position: center;
		background-attachment: fixed;
		color: #fff; /* ensure text stays white */
	  }
	  
	  .sidebar-left {
		display: none;
	  }
	  
	  /* Responsive overrides */
	  @media (max-width: 768px) {
		body.home,
		body.classe,
		body.site {
		  display: block;
		}
	  
		.main {
		  width: 100%;
		}
	  }
	  
	  .navbar {
		display: none;
	  }
	  
	  .form-inline label {
		flex: 1 0 30%;
		min-width: 80px;
	  }
	  
	  .form-inline input {
		flex: 2 1 70%;
		min-width: 100px;
		padding: 0.5em;
		border-radius: 5px;
		border: 1px solid #ccc;
	  }
	  
	  @media (max-width: 768px) {
		.form-inline {
		  flex-direction: column;
		  align-items: stretch;
		}
	  
		.form-inline label,
		.form-inline input {
		  flex: 1 1 100%;
		  width: 100%;
		}
	  }
	  
	  @media (max-width: 768px) {
		form .form-inline {
		  display: block;
		  align-items: stretch;
		}
	  
		.form-inline label,
		.form-inline input {
		  flex: 1 1 100%;
		  width: 100%;
		}
	  }
	  
	  @media (max-width: 768px) {
		.header {
		  display: flex;
		  flex-flow: wrap;
		}
	  }
	  
	  @media (max-width: 768px) {
		.sidebar-left,
		.sidebar-right {
		  /* hidden on small screens */
		}
	  }
	  
	  table {
		width: 100%;
		display: block;
		overflow-x: scroll;
	  }
	  
	  form .form-inline input {
		width: 100%;
	  }
	  
	  @media (min-width: 768px) {
		form .form-inline input {
		  width: 70%;
		}
	  }
	  
	  .header, header {
		background-color: var(--accent);
		border-radius: 10px;
		padding: 1em;
		color: #fff;
		text-align: center;
		display: flex;
		flex-flow: wrap;
		justify-content: space-between;
	  }
	  
	  @media (max-width: 768px) {
		h1 { font-size: 1.5em; }
		h2 { font-size: 1.3em; }
		h3 { font-size: 1.1em; }
		.header {
		  justify-content: center;
		}
	  }
	  
	  :root {
		--accent:#9E88B6BB;
		--accent-dark:#8a73a4cc;
		--accent-darker:#706090CC;
		--bg:#111;
		--surface:#222;
		--text:#fff;
	  }
	  
	  /* hide toggle by default */
	  .sidebar-toggle { display: none !important; }
	  
	  /* DESKTOP sidebar */
	  .sidebar-right {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		align-items: center;
		background: var(--accent);
		color: #fff;
		border-radius: 12px;
		padding: 0.5rem 1rem;
		margin: 1rem 0;
	  }
	  
	  .sidebar-right h5.sidebar-title { display: none; }
	  .sidebar-right ul {
		display:flex;
		gap:0.5rem;
		margin:0;
		padding:10px;
		flex-flow: wrap;
		list-style:none;
	  }
	  .sidebar-right li { margin:0; }
	  .sidebar-right a {
		padding:0.45rem 0.9rem;
		border-radius:20px;
		color:#fff;
		text-decoration:none;
		transition: transform .18s ease, background .18s ease;
	  }
	  .sidebar-right a:hover {
		transform: translateY(-2px);
		background: var(--accent-dark);
	  }
	  
	  /* MOBILE sidebar */
	  @media (max-width: 768px) {
		.sidebar-toggle {
		  display: inline-block !important;
		  background: var(--accent);
		  color:#fff;
		  border:none;
		  padding:.45rem .8rem;
		  border-radius:10px;
		  margin-bottom:.5rem;
		  cursor:pointer;
		  width: 100%;
		  justify-content: center;
		  background: #9E88B6BB;
		}
	  
		.sidebar-right {
		  display: block;
		  max-height: 0;
		  opacity: 0;
		  overflow: hidden;
		  padding: 0 .6rem;
		  transition: max-height .36s ease, opacity .28s ease, padding .2s ease;
		}
	  
		.sidebar-right.open {
		  max-height: calc(100vh - 120px);
		  opacity: 1;
		  padding: .6rem;
		  overflow-y: auto;
		}
	  
		.sidebar-right h5.sidebar-title {
		  display:block;
		  margin-bottom:.5rem;
		}
	  
		.sidebar-right ul {
		  display:flex;
		  flex-direction: column;
		  gap:.35rem;
		  margin:0;
		  padding:0;
		}
	  
		.sidebar-right a {
		  display:block;
		  text-align:left;
		  padding:.6rem .9rem;
		  background: rgba(255,255,255,0.06);
		  border-radius:8px;
		}
	  }
	  
	  table {
		display: block;
		overflow-x: auto;
		white-space: nowrap;
		overflow: auto;
	  }
	  
	  nav > ul {
		background: none;
		border: none;
	  }
	  
	  .navbar {
		display: none;
	  }
	  
	  .main_section {
		padding: 10px;
		font-size: larger;
	  }
	  
	  /* Container grid */
	  main.main {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1.5rem;
		padding: 1rem;
		box-sizing: border-box;
		color: #fff;
	  }
	  
	  /* Individual card */
	  section.matiere {
		display: flex;
		flex-direction: column;
		background: #222a;
		border-radius: 8px;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
		overflow: hidden;
		transition: transform 0.2s ease, box-shadow 0.2s ease;
		color: #fff;
	  }
	  
	  /* Hover effect */
	  section.matiere:hover {
		transform: translateY(-3px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.7);
	  }
	  
	  /* Header (title + nav) */
	  section.matiere > header {
		padding: 0.8rem 1rem;
		background: var(--accent-darker);
		color: #fff;
	  }
	  
	  .matiere-title {
		margin: 0;
		font-size: 1.2rem;
	  }
	  
	  .matiere-articles {
		flex: 1;
		padding: 1rem;
		overflow-x: auto;
	  }
	  
	  .matiere-articles ul {
		list-style: none;
		margin: 0;
		padding: 0;
	  }
	  
	  .matiere-articles li {
		margin-bottom: 0.6rem;
	  }
	  
	  .matiere-articles a {
		text-decoration: none;
		color: #bb86fc;
		font-weight: 500;
	  }
	  
	  .matiere-articles a:hover {
		color: #fff;
	  }
	  
	  .main-title {
		grid-column: 1 / -1;
		font-size: 2rem;
		font-weight: 600;
		margin: 1rem 0 1.5rem 0;
		padding-bottom: 0.5rem;
		border-bottom: 3px solid #6200ea;
		color: #fff;
		text-align: left;
	  }
	  
	  nav > ul > li:hover {
		background-color: none;
		color: none;
		border-right: none;
	  }
	  
	  /* Footer */
	  .footer {
		border-radius: 10px;
		background-color: #9E88B6BB;
		color: #fff;
		padding: 24px 16px;
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		box-shadow: 0 -2px 6px rgba(0, 0, 0, 0.5);
		font-family: "Roboto", "Helvetica Neue", Arial, sans-serif;
		font-size: 14px;
		line-height: 1.5;
	  }
	  
	  .footer a {
		color: #bb86fc;
		text-decoration: none;
		margin: 0 8px;
		transition: color 0.3s ease;
	  }
	  
	  .footer a:hover {
		color: #fff;
	  }
	  
	  .footer::before {
		content: "";
		display: block;
		width: 100%;
		height: 1px;
		background-color: rgba(255, 255, 255, 0.2);
		margin-bottom: 16px;
	  }
	  
	  @media (min-width: 768px) {
		.footer {
		  flex-direction: row;
		  justify-content: space-between;
		  text-align: left;
		}
	  }
	  
	  body {
		min-height: 100vh;
		margin: 0;
		display: flex;
		flex-direction: column;
		//grid-template-rows: auto auto 1fr auto;
	  }
	  main {
		flex-shrink: 0;
		flex-grow: 1;
	  }  
	  fieldset {
		grid-column: 1 / -1;
	  }
	  .btn, .btn-primary-outlined {
		max-width: fit-content;
		max-height: 4rem;
	  }

	  .formulaire {
		display: flex;
		flex-direction: column;
		max-width: 736px;
		margin: 2rem auto;
		padding: 2rem;
		border: 5px solid var(--accent-darker);
		border-radius: 10px;
		background-color: #2228;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
		font-family: "Roboto", sans-serif;
	  }
  .formulaire fieldset {
	display: flex;
	flex-direction: column;
	//justify-content: space-between;
  }
  .formulaire fieldset .form-row {
	display: flex;
	justify-content: space-between;
  }
  .formulaire label {
	display: block;
	margin-bottom: 0.5rem;
	font-size: 1rem;
  }
  
  .formulaire input,
  .formulaire textarea,
  .formulaire select {
	width: 100%;
	padding: 0.75rem;
	margin-bottom: 1.5rem;
	border: 1px solid var(--accent-darker);
	border-radius: 4px;
	font-size: 1rem;
	transition: border-color 0.3s, box-shadow 0.3s;
	background-color: var(--accent);
	color: #F5F5F5;
	transition: box-shadow ease-in-out 0.3s, border-color ease 0.4s, border-width ease 0.5s;
  }
  .formulaire input::placeholder,
  .formulaire textarea::placeholder,
  .formulaire select::placeholder {
	color: #999;
  }
  
  .formulaire input:focus,
  .formulaire textarea:focus,
  .formulaire select:focus {
	border-color: var(--accent);
	outline: none;
	box-shadow: 0 0 0 5px rgba(200, 200, 200, 0.2); /* subtle focus ring */
	background-color: var(--accent);
	border-width: 3px;
	border-color: var(--accent-dark);
	color: var(--text);
  }
  
  .formulaire button {
	display: inline-block;
	background-color: var(--accent-dark);
	padding: 0.75rem 1.5rem;
	font-size: 1rem;
	border: none;
	border-radius: 4px;
	cursor: pointer;
	transition: background-color 0.3s ease;
  }
  
  .formulaire .btn:hover {
	background-color: var(--accent-darker);
	border-color: var(--accent);
	border-width: 2px;
  }
  .icone {
	height: 1.2rem;
  }
	</style>
	<script>
	  document.addEventListener('DOMContentLoaded', function() {
		if(window.location.pathname == '/prepaslvh/hugocolle'){
			window.location.pathname = '/prepaslvh/hugocolle/notes';
		}
		const sidebar = document.querySelector(".sidebar-right");
		if (!sidebar) return;

		// Create toggle button
		const toggleBtn = document.createElement("button");
		toggleBtn.className = "sidebar-toggle";
		toggleBtn.textContent = "☰ Menu";
		sidebar.parentNode.insertBefore(toggleBtn, sidebar);

		toggleBtn.addEventListener("click", () => {
			sidebar.classList.toggle("open");
		});
	  });
	  document.addEventListener("DOMContentLoaded", () => {
		const table = document.querySelector("table.classe");
		if (!table) return;
	  
		const headers = Array.from(table.querySelectorAll("thead td")).map(td => td.textContent.trim());
	  
		table.querySelectorAll("tbody tr").forEach(tr => {
		  Array.from(tr.children).forEach((td, i) => {
			td.setAttribute("data-label", headers[i] || "");
		  });
		});
	  });
	  
	</script>
		` + match);
  
		// Rewrite absolute/relative links to stay in worker
		const schoolEsc = escapeForRegExp(SCHOOL_ORIGIN);
		text = text.replace(new RegExp(`(href|src|action)=["']${schoolEsc}(/prepaslvh[^"']*)["']`, 'gi'), `$1="${WORKER_BASE}$2"`);
		text = text.replace(/(href|src|action)=["'](\/prepaslvh[^"']*)["']/gi, `$1="${WORKER_BASE}$2"`);
  
		clonedHeaders.set('Content-Type', 'text/html; charset=utf-8');
		return new Response(text, { status: upstreamResp.status, headers: clonedHeaders });
	  }
  
	  // Non-HTML content: pass through
	  const arrayBuffer = await upstreamResp.arrayBuffer();
	  return new Response(arrayBuffer, { status: upstreamResp.status, headers: clonedHeaders });
	}
  };
  
  // Helpers
  function copyRequestHeadersForUpstream(inHeaders) {
	const headers = new Headers();
	for (const [k,v] of inHeaders.entries()) {
	  if (k.toLowerCase() === 'host' || k.toLowerCase() === 'origin') continue;
	  headers.set(k,v);
	}
	headers.set('user-agent','hugopreps-proxy/1.0');
	return headers;
  }
  
  function rewriteLocationToWorker(loc, workerBase, schoolOrigin) {
	if (loc.startsWith('/prepaslvh')) return workerBase + loc;
	if (loc.startsWith(schoolOrigin)) return workerBase + loc.slice(schoolOrigin.length);
	if (loc.startsWith('//')) {
	  const stripped = loc.replace(/^\/\//,'https://');
	  if (stripped.startsWith(schoolOrigin)) return workerBase + stripped.slice(schoolOrigin.length);
	}
	return null;
  }
  
  function escapeForRegExp(s) {
	return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  }
  
