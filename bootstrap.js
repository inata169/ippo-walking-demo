// Public bootstrap. Detailed implementation stays versioned under review/v0.3.
(async function () {
  const loading=document.getElementById('loading');
  const timer=setTimeout(()=>{if(!loading.hidden)loading.textContent='読み込みに時間がかかっています。通信状態を確認してください。';},10000);
  try {
    const app=await import('./review/v0.3/app.js');
    await app.start();
    loading.hidden=true;
  } catch(error) {
    loading.hidden=false;
    loading.classList.add('error');
    loading.textContent='3Dを開始できませんでした。Safari、EdgeまたはChromeで再読み込みしてください。詳細：'+String(error.message||error);
    console.error(error);
  } finally {clearTimeout(timer);}
})();
