document.getElementById('fileInput').addEventListener('change', function (event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = function (e) {
    const text = e.target.result;
    const parsed = parseCustomTags(text);
    document.getElementById('output').innerHTML = parsed;
  };
  reader.readAsText(file);
});

function parseCustomTags(text) {
  const codes = text.replace(/\[script\(([^)]+)\)\]/g, (match, inner) => {
    const params = parseParams(inner);
    return "<a class='script'>"+processScript(params)+"</a>";
  });
  const cocode = codes.replace(/\[\[([^\]]*)\]\]/g,(match, inner) => {
    const corret = inner.split("|")
    const coconut = corret[0].split(":")
    switch(coconut[0]) {
      case "image":
        const actio = parseParams(corret[1])
        const src = "../image/"+coconut[1] || "";
        const width = actio.width ? "width='"+actio.width+"'" : "";
        const height = actio.height ? "height='"+actio.height+"'" : "";
        return getImage(src, width, height)
      case "link":
        const link = "../documents/"+coconut[1]
        const show = corret[1] || coconut[1];
        return linkMaker(link,show)
      default:
        const links = corret[0]
        const shows = corret[1] || links
        return linkMaker(links,shows)

    }
  });

  return cocode;
}

function parseParams(paramStr) {
  const result = {};
  paramStr.split(",").forEach(pair => {
    const [key, val] = pair.split("=").map(s => s.trim().replace(/^"|"$/g, ""));
    result[key] = val;
  });
  return result;
}

function processScript(params) {
  switch (params.type) {
    case "age":
      return getAge(params.date);
    case "country":
      return countryName(params.name);
    case "dday":
      return setDday(params.date);
    case "dualnty":
      return dualCountry(params.c1,params.c2);
    default:
      return "[지원되지 않는 타입]";
  }
}

function getAge(date) {
	var nd = new Date()
	var td = new Date(date)
	var year = (nd.getFullYear() - td.getFullYear())
	if(nd.getMonth() < td.getMonth() || nd.getMonth() == td.getMonth() && nd.getDate() < td.getDate()) {
		year--
	}
	return year;
}

function setDday(date) {
	var nd = new Date()
	var td = new Date(date)
	var tRime = nd.getTime() - td.getTime()
	var tDay = Math.ceil(tRime / (1000 * 60 * 60 * 24));
	var pm = (tDay > 0) ? "+" : "-";
	return "D"+pm+Math.abs(tDay);
}

function flag(code) {
	const countryCode = {
		US: "Flag_of_the_United_States",
		KR: "Flag_of_Republic_of_Korea",
    JP: "Flag_of_Japan",
    UK: "Flag_of_the_United_Kingdom",
    SCC: "Flag_of_United_States_of_Central_Chrime",
    SBR: "Flag_of_Sabrot"
	}
	var link = '../image/'+countryCode[code.toUpperCase()]+'.svg'
	var img = "<image class='flag' src='"+link+"' height='20' width='38'/>"
	return img;
}

function countryName(code) {
  const countries = {
    US: "미국",
    KR: "대한민국",
    JP: "일본",
    CN: "중국",
    FR: "프랑스",
    DE: "독일",
    UK: "영국",
    IT: "이탈리아",
    CA: "캐나다",
    AU: "호주",
    SCC: "고성",
    SBR: "신야"
  };
  return "<a class='linkedtext country' href='https://god-lights.github.io/wiki/country/"+code.toUpperCase()+".html'>"+flag(code.toUpperCase())+" "+countries[code.toUpperCase()]+"</a>" || "[알 수 없는 국가]";
}

function dualCountry(c1, c2) {
  const dualc = " (<a class='linkedtext' href='https://god-lights.github.io/wiki/dualnationality'>복수국적</a>)"
  const linemaker = "<a style='color:#ddd;'> | </a>"
  return countryName(c1)+linemaker+countryName(c2)+dualc
}

function getImage(src, width, height) {
  return `<img src="${src}" ${width} ${height} alt="image">`
}

function linkMaker(link, show) {
  return `<a class="linkedtext" href="${link}">${show}</a>`
}
