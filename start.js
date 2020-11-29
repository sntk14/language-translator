const program = "main {\n\
int a = 5;\
int b = 10;\
for int i=0 to a+b step 1 do\
 echo ((i+1)/4);\
next;\
}"

let lex_debug = 0
let sync_debug = 1
let post_debug = 1

try {
    setTimeout(() => {
        let p = new LexAnalizer(program, 0, lex_debug)//<--------------- 1 FILE -------- 0 const Program
        p.lexAnal()
        let r = new SyncAnalizer(p.getTokenStreamTable(), p.getConstsTable(), sync_debug)
        r.parseProgram()
        let post = new PostFixAnalizer(r.getPostfixCode(), p.getConstsTable(), r.getLabels(),post_debug)
        post.postfixProcess()
        console.log(post.getIdentTable())
    }, 50)
} catch (e) {
    console.log(e)
}
