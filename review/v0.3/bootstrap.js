// Classic script: can report an ES-module MIME/load error before app.js runs.
(async function () {
  const loading=document.getElementById('loading');
  const timer=setTimeout(()=>{if(!loading.hidden)loading.textContent='読み込みに時間がかかっています。起動用の黒い画面を閉じていないか確認してください。';},10000);
  try {
    const app=await import('./app.js');
    await app.start();
    loading.hidden=true;
  } catch(error) {
    loading.hidden=false;
    loading.classList.add('error');
    loading.textContent='3Dを開始できませんでした。起動ファイルから開き、EdgeまたはChromeでお試しください。詳細：'+String(error.message||error);
    console.error(error);
  } finally {clearTimeout(timer);}
})();
