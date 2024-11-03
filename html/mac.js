function go(url) {
    window.location.href = url;
}
function run() {
    var url = document.getElementById('uri').value;
    document.getElementById('web').src = url;
}