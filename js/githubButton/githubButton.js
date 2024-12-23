import "https://kit.fontawesome.com/1a245537f8.js";

hi();

function hi() {
    var link = document.createElement('link');
    // link의 속성 설정
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = 'style.css';
    // link를 문서 head에 추가
    document.getElementsByTagName('head')[0].appendChild(link);
  let h = document.querySelectorAll('gitprof');
  h.forEach(function(element) {
    let usenan = element.attributes["username"].value;
    element.onclick = function() {
      window.location.href = `https://github.com/${usenan}`;
      console.log(usenan);
    }
  });
  console.log(h.length);
  return h;
}