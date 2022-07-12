let phrases = [
    "You are awesome",
    "Amazing",
    "Cool"
];
var texts = document.getElementsByTagName("body");
for (var i = 0; i < texts.length; i++) {
    texts[i].innerHTML = '<iframe src="https://giphy.com/embed/Ju7l5y9osyymQ" width="480" height="360" frameBorder="0" class="giphy-embed" allowFullScreen></iframe>';
}