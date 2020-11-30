include('./lex.js')
include('./syn.js')
include('./pos.js')
include('./pol.js')
include('./start.js')

function include(url) {
    let script = document.createElement('script');
    script.src = url;
    document.getElementsByTagName('head')[0].appendChild(script);
}