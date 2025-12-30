<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Olio • Projects Center (POC) — Dashboard</title>
  <style>
    :root{
      --bg: #0b0f17;
      --panel: rgba(255,255,255,.06);
      --stroke: rgba(255,255,255,.10);
      --stroke2: rgba(255,255,255,.14);
      --text: rgba(255,255,255,.88);
      --muted: rgba(255,255,255,.60);
      --muted2: rgba(255,255,255,.45);
      --shadow: 0 12px 40px rgba(0,0,0,.45);
      --radius: 16px;
      --radius2: 22px;
      --primaryW: 260px;
      --branchW: 300px;
      --headerH: 64px;
      --gap: 14px;
      --safe: env(safe-area-inset-bottom, 0px);
      --accentA: rgba(66,135,245,.85);
      --accentB: rgba(138,43,226,.85);
    }

    *{box-sizing:border-box}
    html,body{height:100%}
    body{
      margin:0;
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji";
      background:
        radial-gradient(1200px 600px at 20% -10%, rgba(66,135,245,.20), transparent 60%),
        radial-gradient(900px 500px at 120% 30%, rgba(138,43,226,.18), transparent 55%),
        radial-gradient(900px 800px at 40% 120%, rgba(0,220,170,.10), transparent 60%),
        var(--bg);
      color: var(--text);
      overflow:hidden;
    }

    /* Top bar */
    .topbar{
      height: var(--headerH);
      display:flex;
      align-items:center;
      justify-content:space-between;
      padding: 14px 16px;
      border-bottom: 1px solid var(--stroke);
      backdrop-filter: blur(10px);
      background: rgba(15,18,28,.55);
    }
    .brand{
      display:flex;
      gap:10px;
      align-items:center;
      min-width: 240px;
    }
    .logo{
      width:34px;height:34px;border-radius:12px;
      background: linear-gradient(135deg, var(--accentA), var(--accentB));
      box-shadow: 0 10px 30px rgba(66,135,245,.18);
    }
    .brand h1{
      font-size: 14px;
      margin:0;
      letter-spacing:.3px;
      font-weight: 800;
      white-space:nowrap;
      overflow:hidden;
      text-overflow:ellipsis;
      max-width: 360px;
    }
    .brand p{
      margin:0;
      font-size: 12px;
      color: var(--muted);
    }

    .centerMeta{
      display:flex;
      align-items:center;
      gap:10px;
      justify-content:center;
      flex:1;
      min-width:0;
    }
    .pill{
      display:inline-flex;
      align-items:center;
      gap:8px;
      padding: 8px 10px;
      border-radius: 999px;
      background: rgba(255,255,255,.06);
      border: 1px solid var(--stroke);
      color: var(--muted);
      font-size: 12px;
      white-space: nowrap;
    }
    .dot{
      width:8px;height:8px;border-radius:50%;
      background: #34d399;
      box-shadow: 0 0 0 6px rgba(52,211,153,.15);
    }

    .topRight{
      display:flex;
      align-items:center;
      gap:10px;
      min-width: 360px;
      justify-content:flex-end;
    }
    .searchWrap{
      display:flex;
      align-items:center;
      gap:10px;
      width: min(520px, 36vw);
      background: rgba(255,255,255,.06);
      border: 1px solid var(--stroke);
      border-radius: 14px;
      padding: 10px 12px;
      color: var(--muted);
      cursor:text;
    }
    .searchWrap:focus-within{
      border-color: rgba(66,135,245,.35);
      background: rgba(66,135,245,.10);
    }
    .searchWrap input{
      width: 100%;
      border: none;
      outline: none;
      background: transparent;
      color: rgba(255,255,255,.92);
      font-size: 13px;
    }
    .kbd{
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      font-size: 11px;
      color: var(--muted);
      border:1px solid var(--stroke);
      padding:2px 6px;
      border-radius:8px;
      background: rgba(0,0,0,.18);
      white-space:nowrap;
    }

    /* Shell */
    .shell{
      height: calc(100% - var(--headerH));
      display:flex;
      gap: var(--gap);
      padding: var(--gap);
    }
    .panel{
      background: var(--panel);
      border: 1px solid var(--stroke);
      border-radius: var(--radius2);
      box-shadow: var(--shadow);
      backdrop-filter: blur(12px);
      overflow:hidden;
      position: relative;
    }

    /* Primary sidebar */
    .primary{
      width: var(--primaryW);
      min-width: var(--primaryW);
      display:flex;
      flex-direction:column;
    }
    .primaryHeader{
      padding: 14px 14px 10px 14px;
      border-bottom:1px solid var(--stroke);
      background: rgba(255,255,255,.02);
    }
    .btn{
      display:inline-flex;
      align-items:center;
      justify-content:center;
      gap:8px;
      padding: 10px 12px;
      border-radius: 14px;
      border: 1px solid var(--stroke);
      background: rgba(255,255,255,.06);
      color: rgba(255,255,255,.92);
      cursor:pointer;
      user-select:none;
      transition: transform .08s ease, background .18s ease, border-color .18s ease;
      font-size: 13px;
      font-weight: 650;
      width: 100%;
    }
    .btn:hover{background: rgba(255,255,255,.08); border-color: var(--stroke2);}
    .btn:active{transform: translateY(1px);}
    .btn.ghost{
      background: transparent;
      color: var(--muted);
    }

    .submeta{
      display:flex;
      gap:10px;
      margin-top: 10px;
      flex-wrap:wrap;
    }
    .chip{
      display:inline-flex;
      align-items:center;
      gap:8px;
      padding: 7px 10px;
      border-radius: 999px;
      border: 1px solid var(--stroke);
      background: rgba(255,255,255,.04);
      font-size: 12px;
      color: var(--muted);
      white-space:nowrap;
    }
    .chip strong{color: rgba(255,255,255,.92); font-weight: 800;}

    .nav{
      padding: 10px;
      display:flex;
      flex-direction:column;
      gap:8px;
      flex:1;
      overflow:auto;
    }
    .nav .item{
      display:flex;
      align-items:center;
      gap:10px;
      padding: 11px 12px;
      border-radius: 14px;
      border: 1px solid transparent;
      color: var(--muted);
      cursor:pointer;
      user-select:none;
      transition: background .15s ease, border-color .15s ease, color .15s ease;
    }
    .nav .item:hover{
      background: rgba(255,255,255,.06);
      border-color: rgba(255,255,255,.06);
      color: rgba(255,255,255,.90);
    }
    .nav .item.active{
      background: rgba(66,135,245,.16);
      border-color: rgba(66,135,245,.28);
      color: rgba(255,255,255,.92);
    }
    .nav .item .badge{
      margin-left:auto;
      font-size: 11px;
      color: var(--muted);
      border:1px solid var(--stroke);
      padding:2px 8px;
      border-radius:999px;
      background: rgba(0,0,0,.16);
    }

    .primaryFooter{
      padding: 12px;
      border-top:1px solid var(--stroke);
      background: rgba(255,255,255,.02);
      display:flex;
      flex-direction:column;
      gap:10px;
    }
    .footerRow{
      display:flex;
      gap:10px;
    }
    .footerRow .btn{width: 50%;}
    .footerFull .btn{width: 100%;}

    /* Branch sidebar */
    .branch{
      width: var(--branchW);
      min-width: var(--branchW);
      display:flex;
      flex-direction:column;
      transition: width .18s ease, transform .18s ease, opacity .18s ease;
    }
    .branch.hidden{
      width: 0;
      min-width: 0;
      border: none;
      background: transparent;
      box-shadow:none;
      transform: translateX(-6px);
      opacity: 0;
      pointer-events:none;
      overflow:hidden;
    }
    .branchHeader{
      padding: 14px;
      border-bottom: 1px solid var(--stroke);
      display:flex;
      align-items:center;
      justify-content:space-between;
      background: rgba(255,255,255,.02);
    }
    .branchHeader strong{
      font-size: 13px;
      letter-spacing:.2px;
    }
    .branchBody{
      padding: 12px;
      overflow:auto;
      flex:1;
      display:flex;
      flex-direction:column;
      gap:12px;
    }
    .block{
      border:1px solid var(--stroke);
      border-radius: 16px;
      background: rgba(255,255,255,.04);
      padding: 12px;
    }
    .block h3{
      margin:0 0 10px 0;
      font-size: 12px;
      letter-spacing:.2px;
      color: rgba(255,255,255,.85);
    }
    .checkrow{display:flex; gap:10px; align-items:center; margin:8px 0; color: var(--muted); font-size: 13px;}
    .checkrow input{accent-color: #60a5fa;}
    .tagline{display:flex; flex-wrap:wrap; gap:8px;}
    .tag{
      border:1px solid var(--stroke);
      background: rgba(0,0,0,.18);
      color: var(--muted);
      padding: 6px 10px;
      border-radius: 999px;
      font-size: 12px;
      cursor:pointer;
    }
    .tag.on{color: rgba(255,255,255,.92); border-color: rgba(66,135,245,.35); background: rgba(66,135,245,.14);}

    /* Main area */
    .main{
      flex:1;
      display:flex;
      flex-direction:column;
      min-width: 0;
    }
    .mainHeader{
      padding: 14px 16px;
      border-bottom: 1px solid var(--stroke);
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap: 10px;
      background: rgba(255,255,255,.02);
    }
    .titleStack{min-width:0;}
    .titleStack .big{
      display:flex;
      align-items:center;
      gap:10px;
      min-width:0;
    }
    .titleStack h2{
      margin:0;
      font-size: 15px;
      letter-spacing:.2px;
      white-space:nowrap;
      overflow:hidden;
      text-overflow:ellipsis;
    }
    .subtitle{
      margin:4px 0 0 0;
      font-size: 12px;
      color: var(--muted);
      white-space:nowrap;
      overflow:hidden;
      text-overflow:ellipsis;
    }
    .statusSelect{
      display:flex;
      gap:10px;
      align-items:center;
      justify-content:flex-end;
      flex-wrap:wrap;
    }
    .statusSelect select{
      padding: 9px 10px;
      border-radius: 12px;
      border: 1px solid var(--stroke);
      background: rgba(0,0,0,.18);
      color: rgba(255,255,255,.92);
      outline:none;
      font-size: 12px;
    }

    .content{
      padding: 16px;
      overflow:auto;
      flex:1;
      min-height:0;
    }

    /* Overview content */
    .grid3{
      display:grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
    }
    .card{
      background: rgba(255,255,255,.04);
      border:1px solid var(--stroke);
      border-radius: 18px;
      padding: 14px;
      min-height: 94px;
    }
    .card .k{font-size: 12px; color: var(--muted);}
    .card .v{font-size: 16px; font-weight: 850; margin-top: 6px;}
    .split{
      display:grid;
      grid-template-columns: 1.2fr .8fr;
      gap: 12px;
      margin-top: 12px;
    }
    .list{
      display:flex;
      flex-direction:column;
      gap:10px;
    }
    .row{
      padding: 12px;
      border-radius: 16px;
      border: 1px solid var(--stroke);
      background: rgba(0,0,0,.14);
      display:flex;
      align-items:center;
      gap:10px;
      color: var(--muted);
    }
    .row strong{color: var(--text); font-weight: 800;}
    .row .right{margin-left:auto; display:flex; gap:10px; align-items:center;}
    .mini{font-size: 12px; color: var(--muted2);}
    .pill2{
      font-size: 11px;
      padding: 4px 8px;
      border-radius: 999px;
      border: 1px solid var(--stroke);
      background: rgba(255,255,255,.04);
      color: var(--muted);
    }

    /* Board */
    .kanban{
      display:grid;
      grid-template-columns: repeat(4, minmax(240px, 1fr));
      gap: 12px;
      align-items:start;
    }
    .col{
      border: 1px solid var(--stroke);
      background: rgba(255,255,255,.03);
      border-radius: 18px;
      overflow:hidden;
      min-height: 400px;
    }
    .colHead{
      padding: 12px 12px 10px 12px;
      border-bottom: 1px solid var(--stroke);
      display:flex;
      justify-content:space-between;
      align-items:center;
      gap:10px;
      background: rgba(0,0,0,.10);
    }
    .colHead strong{font-size: 12px; letter-spacing:.3px}
    .addInline{
      width:100%;
      border: 1px solid rgba(255,255,255,.10);
      background: rgba(0,0,0,.14);
      color: rgba(255,255,255,.92);
      border-radius: 12px;
      padding: 8px 10px;
      outline:none;
      font-size: 12px;
    }
    .colBody{
      padding: 10px;
      display:flex;
      flex-direction:column;
      gap:10px;
    }
    .task{
      border:1px solid var(--stroke);
      background: rgba(0,0,0,.16);
      border-radius: 16px;
      padding: 10px;
      cursor:pointer;
      transition: transform .08s ease, border-color .15s ease, background .15s ease;
    }
    .task:hover{border-color: var(--stroke2); background: rgba(0,0,0,.20);}
    .task:active{transform: translateY(1px);}
    .taskTitle{font-size: 13px; font-weight: 800; color: rgba(255,255,255,.92);}
    .taskMeta{margin-top:6px; display:flex; gap:8px; flex-wrap:wrap;}
    .chipWarn{
      font-size: 11px;
      padding: 3px 8px;
      border-radius: 999px;
      border: 1px solid var(--stroke);
      color: var(--muted);
      background: rgba(255,255,255,.03);
    }
    .chipWarn.yellow{border-color: rgba(250,204,21,.35); background: rgba(250,204,21,.10); color: rgba(250,204,21,.95);}
    .chipWarn.red{border-color: rgba(248,113,113,.40); background: rgba(248,113,113,.10); color: rgba(248,113,113,.95);}
    .prio{
      width:8px;height:8px;border-radius:50%;
      background: #60a5fa;
      box-shadow: 0 0 0 6px rgba(96,165,250,.12);
      margin-right: 6px;
      display:inline-block;
    }

    /* Files editor mock */
    .editor{
      border:1px solid var(--stroke);
      background: rgba(0,0,0,.14);
      border-radius: 18px;
      padding: 12px;
      min-height: 320px;
    }
    .editor .top{
      display:flex;
      justify-content:space-between;
      align-items:center;
      margin-bottom: 10px;
      gap:10px;
    }
    .editor .top strong{font-size: 13px;}
    .fakeText{
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      font-size: 12px;
      color: rgba(255,255,255,.80);
      line-height: 1.55;
      white-space: pre-wrap;
      border-radius: 14px;
      border: 1px dashed rgba(255,255,255,.12);
      padding: 10px;
      background: rgba(0,0,0,.10);
      min-height: 240px;
    }

    /* FAB + QC menu */
    .fab{
      position: fixed;
      right: 18px;
      bottom: calc(18px + var(--safe));
      width: 54px;
      height: 54px;
      border-radius: 18px;
      border: 1px solid rgba(255,255,255,.18);
      background: linear-gradient(135deg, var(--accentA), var(--accentB));
      box-shadow: 0 18px 50px rgba(0,0,0,.55);
      cursor:pointer;
      display:flex;
      align-items:center;
      justify-content:center;
      transition: transform .12s ease, filter .15s ease;
      z-index: 50;
    }
    .fab:hover{filter: brightness(1.05);}
    .fab:active{transform: translateY(1px) scale(.99);}
    .fab span{font-size: 24px; font-weight: 900; color: rgba(255,255,255,.95); transform: translateY(-1px);}

    .qcMenu{
      position: fixed;
      right: 18px;
      bottom: calc(86px + var(--safe));
      width: 240px;
      border-radius: 18px;
      border: 1px solid rgba(255,255,255,.14);
      background: rgba(15,18,28,.92);
      backdrop-filter: blur(14px);
      box-shadow: 0 18px 60px rgba(0,0,0,.60);
      overflow:hidden;
      transform-origin: 90% 100%;
      transform: scale(.92) translateY(10px);
      opacity: 0;
      pointer-events:none;
      transition: transform .14s ease, opacity .14s ease;
      z-index: 49;
    }
    .qcMenu.open{
      transform: scale(1) translateY(0);
      opacity: 1;
      pointer-events:auto;
    }
    .qcMenu .head{
      padding: 12px 12px 10px 12px;
      border-bottom: 1px solid rgba(255,255,255,.10);
      display:flex;
      justify-content:space-between;
      align-items:center;
      color: rgba(255,255,255,.92);
      font-size: 12px;
      letter-spacing:.3px;
    }
    .qcMenu .item{
      padding: 12px;
      display:flex;
      gap:10px;
      align-items:center;
      cursor:pointer;
      color: var(--muted);
      border-bottom: 1px solid rgba(255,255,255,.06);
      transition: background .14s ease, color .14s ease;
    }
    .qcMenu .item:last-child{border-bottom:none;}
    .qcMenu .item:hover{
      background: rgba(255,255,255,.06);
      color: rgba(255,255,255,.92);
    }
    .qcMenu .item .i{
      width: 28px; height: 28px;
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,.12);
      background: rgba(255,255,255,.05);
      display:flex;
      align-items:center;
      justify-content:center;
      font-size: 14px;
    }

    /* Overlay + Sheet (Quick Capture) */
    .overlay{
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,.55);
      backdrop-filter: blur(3px);
      opacity:0;
      pointer-events:none;
      transition: opacity .16s ease;
      z-index: 60;
    }
    .overlay.open{opacity:1; pointer-events:auto;}

    .sheet{
      position: fixed;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -46%);
      width: min(520px, calc(100vw - 24px));
      border-radius: 22px;
      border: 1px solid rgba(255,255,255,.14);
      background: rgba(15,18,28,.92);
      box-shadow: 0 22px 90px rgba(0,0,0,.72);
      overflow:hidden;
      opacity:0;
      pointer-events:none;
      transition: transform .16s ease, opacity .16s ease;
      z-index: 61;
    }
    .sheet.open{
      opacity:1;
      pointer-events:auto;
      transform: translate(-50%, -50%);
    }
    .sheetHead{
      padding: 14px;
      border-bottom: 1px solid rgba(255,255,255,.10);
      display:flex;
      justify-content:space-between;
      align-items:center;
      gap:12px;
    }
    .sheetHead strong{font-size: 13px;}
    .sheetBody{padding: 14px; display:flex; flex-direction:column; gap:12px;}
    .field label{display:block; font-size: 12px; color: var(--muted); margin-bottom: 6px;}
    .field input, .field textarea, .field select{
      width: 100%;
      border-radius: 14px;
      border: 1px solid rgba(255,255,255,.12);
      background: rgba(0,0,0,.18);
      color: rgba(255,255,255,.92);
      padding: 10px 12px;
      outline:none;
      font-size: 13px;
    }
    .field textarea{min-height: 92px; resize: vertical;}
    .sheetFooter{
      padding: 12px 14px;
      border-top: 1px solid rgba(255,255,255,.10);
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:10px;
    }
    .saveIndicator{
      display:flex;
      align-items:center;
      gap:8px;
      color: var(--muted);
      font-size: 12px;
    }
    .pulse{
      width: 8px;height:8px;border-radius:50%;
      background: rgba(96,165,250,.95);
      box-shadow: 0 0 0 0 rgba(96,165,250,.35);
      animation: pulse 1.2s infinite;
    }
    @keyframes pulse{
      0%{box-shadow: 0 0 0 0 rgba(96,165,250,.35);}
      70%{box-shadow: 0 0 0 10px rgba(96,165,250,0);}
      100%{box-shadow: 0 0 0 0 rgba(96,165,250,0);}
    }

    /* Command palette */
    .palette{
      position: fixed;
      left: 50%;
      top: 16%;
      transform: translateX(-50%);
      width: min(780px, calc(100vw - 24px));
      border-radius: 22px;
      border: 1px solid rgba(255,255,255,.14);
      background: rgba(15,18,28,.92);
      box-shadow: 0 22px 90px rgba(0,0,0,.72);
      overflow:hidden;
      opacity:0;
      pointer-events:none;
      transition: transform .16s ease, opacity .16s ease;
      z-index: 70;
    }
    .palette.open{
      opacity:1;
      pointer-events:auto;
      transform: translateX(-50%) translateY(6px);
    }
    .paletteHead{
      padding: 12px;
      border-bottom: 1px solid rgba(255,255,255,.10);
      display:flex;
      align-items:center;
      gap:10px;
    }
    .paletteHead input{
      width:100%;
      border:none;
      outline:none;
      background: rgba(255,255,255,.06);
      border: 1px solid rgba(255,255,255,.10);
      border-radius: 14px;
      padding: 12px;
      color: rgba(255,255,255,.92);
      font-size: 14px;
    }
    .results{
      max-height: 380px;
      overflow:auto;
      padding: 10px;
      display:flex;
      flex-direction:column;
      gap: 8px;
    }
    .result{
      padding: 12px;
      border-radius: 16px;
      border: 1px solid rgba(255,255,255,.10);
      background: rgba(0,0,0,.14);
      cursor:pointer;
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:10px;
      color: rgba(255,255,255,.85);
    }
    .result:hover{border-color: rgba(255,255,255,.16); background: rgba(0,0,0,.18);}
    .result small{color: var(--muted);}

    /* Ctrl-hold hint */
    .ctrlHint{
      position: fixed;
      left: 50%;
      top: 78px;
      transform: translateX(-50%) translateY(-6px);
      background: rgba(15,18,28,.92);
      border: 1px solid rgba(255,255,255,.14);
      border-radius: 18px;
      box-shadow: 0 18px 60px rgba(0,0,0,.60);
      padding: 12px 12px;
      width: min(700px, calc(100vw - 24px));
      opacity: 0;
      pointer-events:none;
      transition: opacity .14s ease, transform .14s ease;
      z-index: 80;
    }
    .ctrlHint.show{
      opacity: 1;
      pointer-events:auto;
      transform: translateX(-50%) translateY(0);
    }
    .hintGrid{
      display:grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
      margin-top: 8px;
    }
    .hintItem{
      border: 1px solid rgba(255,255,255,.10);
      background: rgba(0,0,0,.14);
      border-radius: 14px;
      padding: 10px;
      color: rgba(255,255,255,.82);
      display:flex;
      justify-content:space-between;
      gap: 10px;
      align-items:center;
      font-size: 12px;
    }

    @media (max-width: 1100px){
      :root{--branchW: 280px;}
      .kanban{grid-template-columns: repeat(2, minmax(240px, 1fr));}
      .topRight{min-width: 280px;}
      .searchWrap{width: min(520px, 44vw);}
    }
    @media (max-width: 820px){
      body{overflow:auto;}
      .shell{flex-direction:column; height:auto; overflow:visible;}
      .primary{width:100%; min-width:0; order:1;}
      .branch{width:100%; min-width:0; order:2;}
      .main{order:3;}
      .kanban{grid-template-columns: 1fr; }
      .topbar{position: sticky; top:0; z-index: 40; height:auto; flex-wrap:wrap; gap:10px;}
      .centerMeta{justify-content:flex-start; width:100%;}
      .topRight{justify-content:stretch; width:100%;}
      .searchWrap{width:100%;}
      .hintGrid{grid-template-columns: 1fr;}
    }
  </style>
</head>
<body>

  <header class="topbar">
    <div class="brand">
      <div class="logo"></div>
      <div>
        <h1 id="topProjectName">Olio • Project</h1>
        <p id="topProjectDesc">Project workspace</p>
      </div>
    </div>

    <div class="centerMeta">
      <div class="pill"><span class="dot"></span> <span id="metaStatus">Active</span></div>
      <div class="pill">Progress: <strong style="color:rgba(255,255,255,.92)" id="metaProgress">62%</strong></div>
    </div>

    <div class="topRight">
      <div class="searchWrap" id="globalSearchWrap" title="Search within this project (Ctrl+K)">
        <span style="opacity:.85">🔎</span>
        <input id="globalSearch" placeholder="Search tasks, docs, actions…" />
        <span class="kbd">Ctrl K</span>
      </div>
    </div>
  </header>

  <div class="ctrlHint" id="ctrlHint">
    <div style="display:flex; justify-content:space-between; align-items:center; gap:10px;">
      <div style="font-weight:900; letter-spacing:.2px;">Keyboard shortcuts</div>
      <div class="kbd">Hold Ctrl</div>
    </div>
    <div class="hintGrid">
      <div class="hintItem"><span>Search</span><span class="kbd">Ctrl K</span></div>
      <div class="hintItem"><span>Quick Capture</span><span class="kbd">Ctrl J</span></div>
      <div class="hintItem"><span>Close dialogs</span><span class="kbd">Esc</span></div>
    </div>
  </div>

  <div class="shell">
    <!-- Primary sidebar -->
    <aside class="panel primary">
      <div class="primaryHeader">
        <button class="btn" id="backBtn">← Back to Projects</button>

        <div class="submeta">
          <div class="chip"><span class="dot"></span> Status <strong id="sideStatus">Active</strong></div>
          <div class="chip">Progress <strong id="sideProgress">62%</strong></div>
        </div>
      </div>

      <nav class="nav" id="primaryNav">
        <div class="item active" data-section="overview"><span>🏠</span> Overview <span class="badge">5</span></div>
        <div class="item" data-section="board"><span>🧩</span> Board <span class="badge">34</span></div>
        <div class="item" data-section="planner"><span>🗺️</span> Planner <span class="badge">12</span></div>
        <div class="item" data-section="files"><span>📁</span> Files <span class="badge">9</span></div>
        <div class="item" data-section="resources"><span>🔗</span> Resources <span class="badge">18</span></div>
      </nav>

      <div class="primaryFooter">
        <div class="footerRow">
          <button class="btn ghost" id="openPaletteBtn">Search</button>
          <button class="btn ghost" id="helpBtn">Help</button>
        </div>
        <div class="footerFull">
          <button class="btn" id="projectSettingsBtn">⚙ Project Settings</button>
        </div>
      </div>
    </aside>

    <!-- Branch sidebar -->
    <aside class="panel branch hidden" id="branch">
      <div class="branchHeader">
        <strong id="branchTitle">Branch</strong>
        <span class="kbd" style="opacity:.9">Click tab again</span>
      </div>
      <div class="branchBody" id="branchBody"></div>
    </aside>

    <!-- Main content -->
    <main class="panel main">
      <div class="mainHeader">
        <div class="titleStack">
          <div class="big">
            <h2 id="mainTitle">Overview</h2>
            <span class="pill2" id="mainHint">Summary</span>
          </div>
          <div class="subtitle" id="mainSubtitle">High-level status for this project.</div>
        </div>

        <div class="statusSelect">
          <select aria-label="Project status" id="statusSelect">
            <option>Planning</option>
            <option selected>Active</option>
            <option>Review</option>
            <option>Completed</option>
            <option>Archived</option>
          </select>
        </div>
      </div>

      <div class="content" id="content"></div>
    </main>
  </div>

  <!-- Quick Capture Menu + FAB -->
  <div class="qcMenu" id="qcMenu" aria-hidden="true">
    <div class="head">
      <span>Quick Capture</span>
      <span class="mini" style="color:rgba(255,255,255,.45)">Select type</span>
    </div>
    <div class="item" data-qc="task"><div class="i">✅</div> Quick Task</div>
    <div class="item" data-qc="note"><div class="i">📝</div> Quick Note</div>
    <div class="item" data-qc="doc"><div class="i">📄</div> Quick Doc</div>
    <div class="item" data-qc="resource"><div class="i">🔗</div> Quick Resource</div>
  </div>

  <button class="fab" id="fab" aria-label="Quick Capture"><span>+</span></button>

  <!-- Overlay (shared) -->
  <div class="overlay" id="overlay"></div>

  <!-- Quick Capture Sheet -->
  <div class="sheet" id="sheet" role="dialog" aria-modal="true" aria-label="Quick Capture Sheet">
    <div class="sheetHead">
      <strong id="sheetTitle">Quick Capture</strong>
      <button class="btn ghost" style="width:auto;" id="sheetClose">Close</button>
    </div>

    <div class="sheetBody">
      <div class="field">
        <label>Save to</label>
        <select id="qcProject">
          <option selected id="qcProjectCurrent">Current project</option>
          <option>Inbox</option>
        </select>
      </div>

      <div class="field" id="taskColumnField" style="display:none">
        <label>Board column</label>
        <select id="qcColumn">
          <option>Ideas</option>
          <option selected>To Do</option>
          <option>In Progress</option>
          <option>Done</option>
        </select>
      </div>

      <div class="field" id="filesFolderField" style="display:none">
        <label>Folder</label>
        <select id="qcFolder">
          <option selected>Quick Notes</option>
          <option>Meeting Notes</option>
          <option>Ideas</option>
          <option>Research</option>
          <option>Planning</option>
        </select>
      </div>

      <div class="field">
        <label id="qcTitleLabel">Title</label>
        <input id="qcTitle" placeholder="Type…" />
      </div>

      <div class="field">
        <label id="qcBodyLabel">Details</label>
        <textarea id="qcBody" placeholder="Type…"></textarea>
      </div>
    </div>

    <div class="sheetFooter">
      <div class="saveIndicator" id="saveIndicator">
        <span class="pulse"></span>
        <span id="saveText">Saving…</span>
      </div>
      <button class="btn" style="width:auto;" id="sheetDone">Done</button>
    </div>
  </div>

  <!-- Command Palette -->
  <div class="palette" id="palette" role="dialog" aria-modal="true">
    <div class="paletteHead">
      <input id="paletteInput" placeholder="Search tasks, docs, or actions…" />
      <span class="kbd">Esc</span>
    </div>
    <div class="results" id="paletteResults"></div>
  </div>

  <!-- Project Settings (POC sheet) -->
  <div class="sheet" id="settingsSheet" role="dialog" aria-modal="true" aria-label="Project Settings">
    <div class="sheetHead">
      <strong>Project Settings</strong>
      <button class="btn ghost" style="width:auto;" id="settingsClose">Close</button>
    </div>
    <div class="sheetBody">
      <div class="field">
        <label>Project name</label>
        <input id="setName" placeholder="Name" />
      </div>
      <div class="field">
        <label>Description</label>
        <textarea id="setDesc" placeholder="Description"></textarea>
      </div>
      <div class="field">
        <label>Status</label>
        <select id="setStatus">
          <option>Planning</option>
          <option>Active</option>
          <option>Review</option>
          <option>Completed</option>
          <option>Archived</option>
        </select>
      </div>
    </div>
    <div class="sheetFooter">
      <div class="mini">Saved automatically (POC)</div>
      <button class="btn" style="width:auto;" id="settingsDone">Done</button>
    </div>
  </div>

  <script>
    // -----------------------------------
    // Load active project from projects list
    // -----------------------------------
    const defaultProject = {
      id:"p1",
      title:"Mixer’s Playbox",
      desc:"Lobby + mini-games hub (Godot 4.4)",
      status:"Active",
      progress:62
    };

    const activeProject = (() => {
      try {
        const raw = localStorage.getItem("olio_activeProject");
        if (!raw) return defaultProject;
        const p = JSON.parse(raw);
        return {
          id: p.id || defaultProject.id,
          title: p.title || defaultProject.title,
          desc: p.desc || defaultProject.desc,
          status: (p.status ? capitalize(p.status) : defaultProject.status),
          progress: (typeof p.progress === "number" ? p.progress : defaultProject.progress)
        };
      } catch {
        return defaultProject;
      }
    })();

    // -----------------------------------
    // State
    // -----------------------------------
    const state = {
      section: "overview",
      branchVisible: false,
      qcOpen: false,
      sheetOpen: false,
      settingsOpen: false,
      lastSaveTimer: null,
      ctrlTimer: null
    };

    const els = {
      // top/meta
      topProjectName: document.getElementById("topProjectName"),
      topProjectDesc: document.getElementById("topProjectDesc"),
      metaStatus: document.getElementById("metaStatus"),
      metaProgress: document.getElementById("metaProgress"),
      globalSearchWrap: document.getElementById("globalSearchWrap"),
      globalSearch: document.getElementById("globalSearch"),

      // sidebar/meta
      sideStatus: document.getElementById("sideStatus"),
      sideProgress: document.getElementById("sideProgress"),
      statusSelect: document.getElementById("statusSelect"),

      // nav
      primaryNav: document.getElementById("primaryNav"),
      branch: document.getElementById("branch"),
      branchTitle: document.getElementById("branchTitle"),
      branchBody: document.getElementById("branchBody"),

      // main
      mainTitle: document.getElementById("mainTitle"),
      mainHint: document.getElementById("mainHint"),
      mainSubtitle: document.getElementById("mainSubtitle"),
      content: document.getElementById("content"),

      // overlays
      overlay: document.getElementById("overlay"),
      palette: document.getElementById("palette"),
      paletteInput: document.getElementById("paletteInput"),
      paletteResults: document.getElementById("paletteResults"),
      ctrlHint: document.getElementById("ctrlHint"),

      // buttons
      backBtn: document.getElementById("backBtn"),
      openPaletteBtn: document.getElementById("openPaletteBtn"),
      projectSettingsBtn: document.getElementById("projectSettingsBtn"),
      helpBtn: document.getElementById("helpBtn"),

      // QC
      fab: document.getElementById("fab"),
      qcMenu: document.getElementById("qcMenu"),
      sheet: document.getElementById("sheet"),
      sheetTitle: document.getElementById("sheetTitle"),
      sheetClose: document.getElementById("sheetClose"),
      sheetDone: document.getElementById("sheetDone"),
      taskColumnField: document.getElementById("taskColumnField"),
      filesFolderField: document.getElementById("filesFolderField"),
      qcTitleLabel: document.getElementById("qcTitleLabel"),
      qcBodyLabel: document.getElementById("qcBodyLabel"),
      qcTitle: document.getElementById("qcTitle"),
      qcBody: document.getElementById("qcBody"),
      saveIndicator: document.getElementById("saveIndicator"),
      saveText: document.getElementById("saveText"),
      qcProjectCurrent: document.getElementById("qcProjectCurrent"),

      // Settings sheet
      settingsSheet: document.getElementById("settingsSheet"),
      settingsClose: document.getElementById("settingsClose"),
      settingsDone: document.getElementById("settingsDone"),
      setName: document.getElementById("setName"),
      setDesc: document.getElementById("setDesc"),
      setStatus: document.getElementById("setStatus"),
    };

    // -----------------------------------
    // Init project UI
    // -----------------------------------
    function syncProjectUI(){
      els.topProjectName.textContent = `Olio • ${activeProject.title}`;
      els.topProjectDesc.textContent = activeProject.desc;

      els.metaStatus.textContent = activeProject.status;
      els.sideStatus.textContent = activeProject.status;

      els.metaProgress.textContent = `${activeProject.progress}%`;
      els.sideProgress.textContent = `${activeProject.progress}%`;

      els.qcProjectCurrent.textContent = `${activeProject.title} (current)`;

      // sync status select
      [...els.statusSelect.options].forEach(o => {
        o.selected = (o.value === activeProject.status);
      });
    }

    // -----------------------------------
    // Section rendering
    // -----------------------------------
    function renderSection(){
      const s = state.section;

      // Branch rules: only Board/Planner/Files have a branch sidebar
      const canHaveBranch = (s === "board" || s === "planner" || s === "files");
      if (!canHaveBranch) state.branchVisible = false;

      els.branch.classList.toggle("hidden", !state.branchVisible);

      const meta = {
        overview: { title: "Overview", hint: "Summary", sub: "High-level status for this project." },
        board: { title: "Board", hint: "Kanban", sub: "Tasks organized by workflow." },
        planner: { title: "Planner", hint: "Plan steps", sub: "Structured planning." },
        files: { title: "Files", hint: "Documents", sub: "Notes and documents." },
        resources: { title: "Resources", hint: "Links", sub: "Reference material and tools." }
      };

      els.mainTitle.textContent = meta[s].title;
      els.mainHint.textContent = meta[s].hint;
      els.mainSubtitle.textContent = meta[s].sub;

      els.branchTitle.textContent =
        s === "board" ? "Board Tools" :
        s === "planner" ? "Planner" :
        s === "files" ? "File Tree" :
        "Branch";

      els.branchBody.innerHTML = (state.branchVisible ? branchTemplate(s) : "");
      els.content.innerHTML = mainTemplate(s);
    }

    function branchTemplate(section){
      if (section === "board") {
        return `
          <div class="block">
            <h3>Filters</h3>
            <div class="checkrow"><input type="checkbox"> Due soon</div>
            <div class="checkrow"><input type="checkbox"> Overdue</div>
            <div class="checkrow"><input type="checkbox"> High priority</div>
            <div class="checkrow"><input type="checkbox"> Has files</div>
          </div>
          <div class="block">
            <h3>Tags</h3>
            <div class="tagline">
              <div class="tag on">#godot</div>
              <div class="tag">#ui</div>
              <div class="tag">#net</div>
              <div class="tag">#polish</div>
            </div>
          </div>
          <div class="block">
            <h3>Archived</h3>
            <div class="row" style="margin:0;">
              <strong>Archived cards</strong>
              <div class="right"><span class="pill2">12</span></div>
            </div>
          </div>
        `;
      }

      if (section === "planner") {
        return `
          <div class="block">
            <h3>Mode</h3>
            <div class="checkrow"><input type="radio" name="pmode" checked> Manual</div>
            <div class="checkrow"><input type="radio" name="pmode"> AI-Assisted</div>
          </div>
          <div class="block">
            <h3>Steps</h3>
            <div class="row" style="margin:0;"><strong>1</strong> Define scope <span class="right mini">✓</span></div>
            <div class="row" style="margin:0;"><strong>2</strong> Build UI <span class="right mini">Next</span></div>
            <div class="row" style="margin:0;"><strong>3</strong> Add settings</div>
          </div>
        `;
      }

      // files
      return `
        <div class="block">
          <h3>Folders</h3>
          <div class="row" style="margin:0;"><strong>📁 Project Root</strong></div>
          <div class="row" style="margin:0; opacity:.95;">&nbsp;&nbsp;📁 Planning</div>
          <div class="row" style="margin:0; opacity:.95;">&nbsp;&nbsp;📁 Research</div>
          <div class="row" style="margin:0; opacity:.95;">&nbsp;&nbsp;📁 Ideas</div>
          <div class="row" style="margin:0; opacity:.95;">&nbsp;&nbsp;📁 Meeting Notes</div>
          <div class="row" style="margin:0; opacity:.95;">&nbsp;&nbsp;📄 Quick Notes</div>
        </div>
        <div class="block">
          <h3>Actions</h3>
          <button class="btn" style="width:100%;">+ New Doc</button>
          <button class="btn ghost" style="width:100%; margin-top:10px;">+ New Folder</button>
          <div style="height:10px"></div>
          <input class="addInline" placeholder="Search files…" />
        </div>
      `;
    }

    function mainTemplate(section){
      if (section === "overview") {
        return `
          <div class="grid3">
            <div class="card"><div class="k">Tasks</div><div class="v">21 / 34</div></div>
            <div class="card"><div class="k">Planner</div><div class="v">6 / 12</div></div>
            <div class="card"><div class="k">Last updated</div><div class="v">10m ago</div></div>
          </div>

          <div class="split">
            <div class="card">
              <div class="k" style="margin-bottom:10px;">Pinned items</div>
              <div class="list">
                <div class="row"><span>📌</span><strong>Task:</strong> Fix split-screen camera jitter <span class="right"><span class="pill2">High</span></span></div>
                <div class="row"><span>📌</span><strong>Doc:</strong> Lobby flow notes <span class="right"><span class="mini">edited</span></span></div>
                <div class="row"><span>📌</span><strong>Resource:</strong> Godot multiplayer docs <span class="right"><span class="mini">link</span></span></div>
              </div>
            </div>

            <div class="card">
              <div class="k" style="margin-bottom:10px;">Recent activity</div>
              <div class="list">
                <div class="row"><strong>✓</strong> Checked off “Player 2 input mapping” <span class="right mini">2m</span></div>
                <div class="row"><strong>✎</strong> Edited doc “Lobby flow” <span class="right mini">12m</span></div>
                <div class="row"><strong>＋</strong> Added card “Name validation” <span class="right mini">1h</span></div>
                <div class="row"><strong>📌</strong> Pinned “Networking tips” <span class="right mini">yday</span></div>
                <div class="row"><strong>🗄</strong> Archived “Old camera idea” <span class="right mini">3d</span></div>
              </div>
            </div>
          </div>
        `;
      }

      if (section === "board") {
        return `
          <div class="kanban">
            ${col("Ideas", [
              task("Consider pause menu UX", ["prio: low"]),
              task("Add tutorial hints", ["prio: med"]),
            ])}
            ${col("To Do", [
              task("Fix split-screen camera jitter", ["due: tomorrow","prio: high"], "yellow"),
              task("Add name entry validation", ["prio: med"]),
              task("Settings modal polish", ["due: overdue","prio: high"], "red"),
            ])}
            ${col("In Progress", [
              task("Independent camera controls", ["prio: high"]),
              task("Lobby multiplayer start flow", ["prio: med"]),
            ])}
            ${col("Done", [
              task("Player input mapping", ["done"]),
              task("Basic lobby UI", ["done"]),
            ])}
          </div>
        `;
      }

      if (section === "planner") {
        return `
          <div class="card">
            <div class="k">Project Plan</div>
            <div class="v" style="font-size:14px; font-weight:800; margin-top:6px;">Manual Mode</div>
            <div class="mini" style="margin-top:6px;">Steps can be reordered and converted into board cards later.</div>
          </div>

          <div style="height:12px"></div>

          <div class="list">
            <div class="row"><strong>1.</strong> Define scope & success criteria <span class="right"><span class="pill2">✓</span></span></div>
            <div class="row"><strong>2.</strong> Build UI for game selection screen <span class="right"><span class="pill2">Next</span></span></div>
            <div class="row"><strong>3.</strong> Split-screen camera: independent control <span class="right"><span class="pill2">Doing</span></span></div>
            <div class="row"><strong>4.</strong> Add settings and shortcuts <span class="right"><span class="pill2">Later</span></span></div>
          </div>

          <div style="height:12px"></div>
          <button class="btn" style="width:auto;">+ Add step</button>
          <button class="btn ghost" style="width:auto; margin-left:10px;">Convert to Board Cards</button>
        `;
      }

      if (section === "files") {
        return `
          <div class="editor">
            <div class="top">
              <strong>Doc: Meeting Notes — Dec 29</strong>
              <span class="mini">Saved</span>
            </div>
            <div class="fakeText"># Meeting Notes — Dec 29

- Polish the Projects Center navigation
- Add project settings panel
- Make search feel global

## Next
- Build Projects List page
- Hook up command palette results</div>
          </div>

          <div style="height:12px"></div>

          <div class="card">
            <div class="k">Linked tasks</div>
            <div class="list" style="margin-top:10px;">
              <div class="row"><strong>Task:</strong> Improve retry logic <span class="right mini">To Do</span></div>
              <div class="row"><strong>Task:</strong> Polish Quick Capture <span class="right mini">In Progress</span></div>
            </div>
          </div>
        `;
      }

      // resources
      return `
        <div class="card">
          <div class="k">Paste to import</div>
          <div style="display:flex; gap:10px; margin-top:10px;">
            <input class="addInline" placeholder="https://..." />
            <button class="btn" style="width:auto;">Import</button>
          </div>
        </div>

        <div style="height:12px"></div>

        <div class="list">
          <div class="row"><strong>PWA Checklist</strong> <span class="right"><span class="mini">tools</span></span></div>
          <div class="row"><strong>UI Font Pairing Guide</strong> <span class="right"><span class="mini">references</span></span></div>
          <div class="row"><strong>Godot Multiplayer Docs</strong> <span class="right"><span class="mini">references</span></span></div>
        </div>
      `;
    }

    function col(name, tasksHtml) {
      return `
        <div class="col">
          <div class="colHead">
            <strong>${name.toUpperCase()}</strong>
          </div>
          <div style="padding: 0 10px 10px 10px;">
            <input class="addInline" placeholder="+ Quick add…" />
          </div>
          <div class="colBody">
            ${tasksHtml.join("")}
          </div>
        </div>
      `;
    }

    function task(title, meta = [], warn = null) {
      const warnChip = warn === "yellow"
        ? `<span class="chipWarn yellow">due soon</span>`
        : warn === "red"
          ? `<span class="chipWarn red">overdue</span>`
          : "";

      const metaChips = meta.map(m => `<span class="chipWarn">${escapeHtml(m)}</span>`).join("");

      return `
        <div class="task" title="POC card">
          <div class="taskTitle"><span class="prio"></span>${escapeHtml(title)}</div>
          <div class="taskMeta">
            ${warnChip}
            ${metaChips}
          </div>
        </div>
      `;
    }

    // -----------------------------------
    // Nav behavior:
    // - clicking a tab changes section
    // - clicking the ACTIVE tab again toggles branch sidebar (if that section supports it)
    // -----------------------------------
    function sectionSupportsBranch(s){
      return (s === "board" || s === "planner" || s === "files");
    }

    els.primaryNav.addEventListener("click", (e) => {
      const item = e.target.closest(".item");
      if (!item) return;

      const nextSection = item.dataset.section;

      // Clicking active tab again toggles branch (only for supported sections)
      const isSame = (nextSection === state.section);
      if (isSame && sectionSupportsBranch(nextSection)) {
        state.branchVisible = !state.branchVisible;
        renderSection();
        return;
      }

      // Switch section
      state.section = nextSection;

      // Default branch behavior: open when entering a section that uses it
      state.branchVisible = sectionSupportsBranch(nextSection);

      // Update active styles
      [...els.primaryNav.querySelectorAll(".item")].forEach(n => n.classList.toggle("active", n === item));
      renderSection();
    });

    // -----------------------------------
    // Back to projects
    // -----------------------------------
    els.backBtn.addEventListener("click", () => {
      window.location.href = "../projectCenter.html";
    });

    // -----------------------------------
    // Global search + command palette (Ctrl+K override)
    // -----------------------------------
    function openPalette(prefill=""){
      els.overlay.classList.add("open");
      els.palette.classList.add("open");
      els.paletteInput.value = prefill;
      renderPaletteResults(prefill);
      setTimeout(()=>els.paletteInput.focus(), 10);
    }
    function closePalette(){
      els.palette.classList.remove("open");
      // overlay might also be used by sheets
      if (!state.sheetOpen && !state.settingsOpen) els.overlay.classList.remove("open");
    }

    const demoItems = [
      { title:"Go to Overview", meta:"Navigation", run: () => jumpTo("overview") },
      { title:"Go to Board", meta:"Navigation", run: () => jumpTo("board") },
      { title:"Go to Planner", meta:"Navigation", run: () => jumpTo("planner") },
      { title:"Go to Files", meta:"Navigation", run: () => jumpTo("files") },
      { title:"Go to Resources", meta:"Navigation", run: () => jumpTo("resources") },
      { title:"Open Project Settings", meta:"Action", run: () => openSettings() },
      { title:"Quick Capture: Task", meta:"Action", run: () => openSheet("task") },
      { title:"Quick Capture: Note", meta:"Action", run: () => openSheet("note") },
      { title:"Task: Fix split-screen camera jitter", meta:"Board card", run: () => jumpTo("board") },
      { title:"Doc: Meeting Notes — Dec 29", meta:"File", run: () => jumpTo("files") },
    ];

    function renderPaletteResults(q){
      const query = (q||"").trim().toLowerCase();
      const results = demoItems.filter(x => !query || x.title.toLowerCase().includes(query)).slice(0, 10);

      els.paletteResults.innerHTML = results.map((r, i) => `
        <div class="result" data-idx="${i}">
          <div>
            <div style="font-weight:850; letter-spacing:.2px;">${escapeHtml(r.title)}</div>
            <small>${escapeHtml(r.meta)}</small>
          </div>
          <div class="kbd">Enter</div>
        </div>
      `).join("");

      els.paletteResults.querySelectorAll(".result").forEach(el => {
        el.addEventListener("click", () => {
          const r = results[+el.dataset.idx];
          closePalette();
          r.run();
        });
      });

      els.paletteInput.onkeydown = (e) => {
        if (e.key === "Enter" && results[0]) {
          closePalette();
          results[0].run();
        }
      };
    }

    els.paletteInput.addEventListener("input", () => renderPaletteResults(els.paletteInput.value));
    els.globalSearchWrap.addEventListener("click", () => openPalette(els.globalSearch.value || ""));
    els.openPaletteBtn.addEventListener("click", () => openPalette(""));

    // Override Chrome Ctrl+K
    window.addEventListener("keydown", (e) => {
      if (e.ctrlKey && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        openPalette(els.globalSearch.value || "");
        return;
      }
      // Ctrl+J opens Quick Capture menu (nice-to-have)
      if (e.ctrlKey && (e.key === "j" || e.key === "J")) {
        e.preventDefault();
        toggleQC(true);
        return;
      }
      if (e.key === "Escape") {
        closePalette();
        closeSheet();
        closeSettings();
        toggleQC(false);
      }
    });

    // -----------------------------------
    // Hold Ctrl to show shortcuts
    // -----------------------------------
    window.addEventListener("keydown", (e) => {
      if (e.key !== "Control") return;
      if (state.ctrlTimer) return;
      state.ctrlTimer = setTimeout(() => {
        els.ctrlHint.classList.add("show");
      }, 850);
    });

    window.addEventListener("keyup", (e) => {
      if (e.key !== "Control") return;
      clearTimeout(state.ctrlTimer);
      state.ctrlTimer = null;
      els.ctrlHint.classList.remove("show");
    });

    // -----------------------------------
    // Quick Capture FAB + menu + sheet
    // -----------------------------------
    function toggleQC(open){
      state.qcOpen = open;
      els.qcMenu.classList.toggle("open", open);
      els.qcMenu.setAttribute("aria-hidden", open ? "false" : "true");
    }

    els.fab.addEventListener("click", () => toggleQC(!state.qcOpen));

    // Close QC if clicking outside
    window.addEventListener("click", (e) => {
      const inFab = e.target.closest("#fab");
      const inMenu = e.target.closest("#qcMenu");
      const inSheet = e.target.closest("#sheet") || e.target.closest("#settingsSheet") || e.target.closest("#palette");
      if (!inFab && !inMenu && !inSheet) toggleQC(false);
    });

    els.qcMenu.addEventListener("click", (e) => {
      const item = e.target.closest(".item");
      if (!item) return;
      openSheet(item.dataset.qc);
      toggleQC(false);
    });

    function openSheet(type){
      state.sheetOpen = true;
      els.overlay.classList.add("open");
      els.sheet.classList.add("open");

      els.sheetTitle.textContent =
        type === "task" ? "Quick Task" :
        type === "note" ? "Quick Note" :
        type === "doc" ? "Quick Doc" :
        "Quick Resource";

      els.taskColumnField.style.display = (type === "task") ? "block" : "none";
      els.filesFolderField.style.display = (type === "note" || type === "doc") ? "block" : "none";

      els.qcTitleLabel.textContent = (type === "resource") ? "Title" : "Title";
      els.qcBodyLabel.textContent = (type === "resource") ? "URL / Details" : "Details";

      els.qcTitle.value = "";
      els.qcBody.value = "";
      setSaveState("saved");

      setTimeout(() => els.qcTitle.focus(), 10);
    }

    function closeSheet(){
      if (!state.sheetOpen) return;
      state.sheetOpen = false;
      els.sheet.classList.remove("open");
      if (!els.palette.classList.contains("open") && !state.settingsOpen) {
        els.overlay.classList.remove("open");
      }
      clearTimeout(state.lastSaveTimer);
    }

    els.sheetClose.addEventListener("click", closeSheet);
    els.sheetDone.addEventListener("click", closeSheet);

    function setSaveState(mode){
      if (mode === "saving"){
        els.saveText.textContent = "Saving…";
        els.saveIndicator.querySelector(".pulse").style.display = "inline-block";
      } else {
        els.saveText.textContent = "Saved ✓";
        els.saveIndicator.querySelector(".pulse").style.display = "none";
      }
    }

    function onUserType(){
      setSaveState("saving");
      clearTimeout(state.lastSaveTimer);
      state.lastSaveTimer = setTimeout(() => setSaveState("saved"), 420);
    }

    els.qcTitle.addEventListener("input", onUserType);
    els.qcBody.addEventListener("input", onUserType);

    // -----------------------------------
    // Project Settings (POC)
    // -----------------------------------
    function openSettings(){
      state.settingsOpen = true;
      els.overlay.classList.add("open");
      els.settingsSheet.classList.add("open");

      els.setName.value = activeProject.title;
      els.setDesc.value = activeProject.desc;
      els.setStatus.value = activeProject.status;

      setTimeout(() => els.setName.focus(), 10);
    }

    function closeSettings(){
      if (!state.settingsOpen) return;
      state.settingsOpen = false;
      els.settingsSheet.classList.remove("open");
      if (!els.palette.classList.contains("open") && !state.sheetOpen) {
        els.overlay.classList.remove("open");
      }
    }

    function applySettings(){
      activeProject.title = els.setName.value.trim() || activeProject.title;
      activeProject.desc = els.setDesc.value.trim() || activeProject.desc;
      activeProject.status = els.setStatus.value;
      syncProjectUI();
      // store back to localStorage for the POC
      localStorage.setItem("olio_activeProject", JSON.stringify({
        id: activeProject.id,
        title: activeProject.title,
        desc: activeProject.desc,
        status: activeProject.status.toLowerCase(),
        progress: activeProject.progress
      }));
    }

    els.projectSettingsBtn.addEventListener("click", openSettings);
    els.settingsClose.addEventListener("click", () => { applySettings(); closeSettings(); });
    els.settingsDone.addEventListener("click", () => { applySettings(); closeSettings(); });

    els.setName.addEventListener("input", applySettings);
    els.setDesc.addEventListener("input", applySettings);
    els.setStatus.addEventListener("change", applySettings);

    // -----------------------------------
    // Status select sync (header dropdown)
    // -----------------------------------
    els.statusSelect.addEventListener("change", () => {
      activeProject.status = els.statusSelect.value;
      syncProjectUI();
      localStorage.setItem("olio_activeProject", JSON.stringify({
        id: activeProject.id,
        title: activeProject.title,
        desc: activeProject.desc,
        status: activeProject.status.toLowerCase(),
        progress: activeProject.progress
      }));
    });

    // -----------------------------------
    // Overlay click closes top-most thing (POC logic)
    // -----------------------------------
    els.overlay.addEventListener("click", () => {
      if (els.palette.classList.contains("open")) closePalette();
      if (state.settingsOpen) closeSettings();
      if (state.sheetOpen) closeSheet();
    });

    // -----------------------------------
    // Helpers
    // -----------------------------------
    function jumpTo(section){
      state.section = section;
      state.branchVisible = sectionSupportsBranch(section);

      const target = els.primaryNav.querySelector(`.item[data-section="${section}"]`);
      if (target){
        [...els.primaryNav.querySelectorAll(".item")].forEach(n => n.classList.toggle("active", n === target));
      }
      renderSection();
    }

    function capitalize(s){
      if (!s) return s;
      return s.charAt(0).toUpperCase() + s.slice(1);
    }

    function escapeHtml(str){
      return String(str)
        .replaceAll("&","&amp;")
        .replaceAll("<","&lt;")
        .replaceAll(">","&gt;")
        .replaceAll('"',"&quot;")
        .replaceAll("'","&#039;");
    }

    // -----------------------------------
    // Init
    // -----------------------------------
    syncProjectUI();
    renderSection();
  </script>
</body>
</html>
