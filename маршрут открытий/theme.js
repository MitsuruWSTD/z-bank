/* применяет тему до первой отрисовки, чтобы не было вспышки */
(function(){
  try{
    var t = localStorage.getItem('mro-theme');
    if(!t) t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', t);
  }catch(e){}
})();