class SyncAnalizer {
    constructor(lexTable, identTable, debug) {
        this.lexTable = lexTable
        this.identTable
        this.row = 0
        this.level = 0
        this.postfixCode = []
        this.labels = []
        this.isBracket = 0//таблиця ПОЛІЗу
        this.isViewPOLIZSteps = debug
        this.POLIZStep = 1
        this.log = ''
    }

    getInPOLIZWrire(el) {
        return el.lexeme
    }

    getLabels() {
        return this.labels
    }

    setPostfixCode(lexeme) {
        // if (this.isSetPostfixCode) {
        this.postfixCode.push(lexeme)
        if (this.isViewPOLIZSteps) {
            console.log(`Крок трансляцiї:${this.POLIZStep} \n Лексема: ${this.getInPOLIZWrire(lexeme)} \n postfixCode: [${this.postfixCode.map(el => this.getInPOLIZWrire(el))}] \n`)
            if (lexeme != 'int' && lexeme != 'float') this.POLIZStep++
        }
        // }
    }

    createLabel() {
        //return size of array, which is a number of label
        let len = this.labels.length
        let val = this.postfixCode.length - 1
        this.labels.push({label: `m${len}`, value: val})
        return `m${len}`
    }

    setLabelValue(label) {
        //indicate on tail
        this.labels = this.labels.map(l => {
            if (l.label === label) l.value = this.postfixCode.length - 1
            return l
        })
    }

    parseProgram() {
        try {
            this.parseToken('main', 'keyword')
            this.parseToken('{', 'brackets_op')
            this.parseStatementList()
            this.parseToken('}', 'brackets_op')

            if (this.isViewPOLIZSteps){
                console.log('POSTFIX CODE:')
                console.log(this.postfixCode)
                console.log(this.log)
            }
            console.log('Успішне завершення синтаксичного аналізатора та перекладу в ПОЛІЗ!')
        } catch (e) {
            this.failParse(e);
            throw  new Error('Синтаксичний аналізатор аварійно завершив роботу!')
        }
    }

    parseToken(lexeme, token, ident) {
        if (this.row > (this.lexTable.length - 1)) throw `Помилка: очікували ${lexeme} [${token}]` //this.failParse(lexeme, token,this.row)

        let lexRow = this.getSymb()
        if (lexRow.token == token && lexRow.lexeme == lexeme) {
            this.addRow()
            return true
        } else {
            throw `Hевідповідність токенів, маємо ${lexRow.lexeme}[${lexRow.token}] у рядку ${lexRow.row}`;// , а очікували: ${lexeme}[${token}]
        }
    }

    getSymb(row = false) {
        if (this.row > (this.lexTable.length - 1)) {
            let lex = this.lexTable[this.row - 1]
            throw `Помилка взяття символа після ${lex.lexeme} у рядку [${lex.row}]`
        } //this.failParse(lexeme, token,this.row)

        if (row) return this.lexTable[row]

        return this.lexTable[this.row]
    }

    failParse(e) {
        console.log(e)
        if (this.row < (this.lexTable.length - 1)) {
            // console.log(`ROW: ${this.row} LENGHT: ${this.lexTable.length}`)
            let lexRow = this.getSymb(this.row)
            //	console.log(`Помилка: у ${lexRow.row} рядку неочікуваний символ ${lexRow.lexeme}`)
        }
    }

    addRow() {
        this.row++
    }

    addLevel() {
        this.level++
    }

    subLevel() {
        this.level--
    }

    parseStatementList() {
        while (this.parseStatement()) {
            true//this.addRow()
        }
    }


    parseStatement() {
        let lexRow = this.getSymb()

        if (this.checkLexToken(lexRow, {lexeme: 'if', token: 'keyword'})) {
            this.parseIf()
            return true
        }

        if (this.checkLexToken(lexRow, {lexeme: 'for', token: 'keyword'})) {
            this.parseFor()
            return true
        }

        if (this.checkLexToken(lexRow, {lexeme: 'int', token: 'keyword'}) ||
            this.checkLexToken(lexRow, {lexeme: 'float', token: 'keyword'}) ||
            this.checkLexToken(lexRow, {lexeme: 'bool', token: 'keyword'})) {

            this.parseAssign()
            this.addRow()
            return true
        }
        if (lexRow.token == 'ident') {
            this.parseAssign()

            this.addRow()
            return true
        }
        if (lexRow.token == 'nl') {
            this.addRow()
            return true
        }
        if (this.checkLexToken(lexRow, {lexeme: 'echo', token: 'keyword'}) ||
            this.checkLexToken(lexRow, {lexeme: 'read', token: 'keyword'})) {

            this.parseFunction()
            this.addRow()

            return true
        }


        return false
    }


    checkLexToken(lexRow, {lexeme, token}) {
        if (lexRow.token == token && lexRow.lexeme == lexeme) return true

        return false
    }


    parseAssign() {
        let lexRow = this.getSymb()
        if (lexRow.lexeme == 'int' || lexRow.lexeme == 'float') {//чисельные значения присвоение
            this.setPostfixCode(lexRow)
            this.logger('ExpAssign Statement')
            this.addRow()
            lexRow = this.getSymb()
            if (!this.getSymb().token == 'ident') throw `У рядку ${this.getSymb().row} має бути змінна`
            this.addRow()
            this.parseToken('=', 'assign_op')
            this.setPostfixCode(lexRow)
            this.parseExpression()
            this.setPostfixCode({lexeme: '='})
            return lexRow.lexeme
        } else if (lexRow.lexeme == 'bool') {//логические значения присвоение
            this.setPostfixCode(lexRow)
            this.logger('BoolAssign Statement')
            this.addRow()
            lexRow = this.getSymb()
            if (!this.getSymb().token == 'ident') throw `У рядку ${this.getSymb().row} має бути змінна`
            this.addRow()
            this.parseToken('=', 'assign_op')
            this.setPostfixCode(lexRow)
            this.parseBoolExpr()
            this.setPostfixCode({lexeme: '='})
        } else if (lexRow.token == 'ident') {//переприсвоние
            this.logger('ReAssign Statement')
            this.addRow()
            this.parseToken('=', 'assign_op')
            this.setPostfixCode(lexRow)
            this.parseBoolExpr(1)
            this.setPostfixCode({lexeme: '='})
            return lexRow.lexeme
        } else {
            return false
        }
        return true
    }

    parseBoolExpr(ext = 0) {
        let lexRow = this.getSymb()
        // this.parseTemp()
        if (lexRow.lexeme == 'false' || lexRow.lexeme == 'true') {
            this.addRow()
            this.setPostfixCode(lexRow)
            return true
        }

        this.parseExpression()
        lexRow = this.getSymb()
        if (lexRow.token === 'rel_op') {
            this.addRow()
            this.parseExpression()
            this.setPostfixCode(lexRow)
        } else {
            if (ext) {
                return true
            } else {
                lexRow = this.getSymb()
                throw `Помилка логічного виразу y ${lexRow.row} рядку`
            }
        }
        return true
    }

    parseExpression() {
        let lexRow = this.getSymb()
        this.parseFactor()
        let F = true
        while (F) {
            lexRow = this.getSymb()
            if (['add_op'].includes(lexRow.token)) {
                this.addRow()
                this.parseFactor()
                this.setPostfixCode(lexRow)
            } else {
                F = false
            }
        }
        return true
    }

    parseFactor() {
        let lexRow = this.getSymb()
        this.parseFactor1()
        let F = true
        while (F) {
            lexRow = this.getSymb()
            if (['mult_op'].includes(lexRow.token)) {
                this.addRow()
                this.parseFactor1()
                this.setPostfixCode(lexRow)
            } else {
                F = false
            }
        }
        return true
    }


    parseFactor1() {
        let lexRow = this.getSymb()
        this.parseTemp()
        let F = true
        while (F) {
            lexRow = this.getSymb()
            if (['degr_op'].includes(lexRow.token)) {
                this.addRow()
                this.parseTemp()
                this.setPostfixCode(lexRow)
            } else {
                F = false
            }
        }
        return true
    }


    parseTemp() {
        let lexRow = this.getSymb()
        //если знак
        let sing = false
        if (lexRow.lexeme === '-' || lexRow.lexeme === '+') {
            sing = lexRow.lexeme === '-' ? '-1' : '1'
            this.addRow()
            lexRow = this.getSymb()
        }
            // this.setPostfixCode({lexeme:'-', token: 'minus'})

        if (['int', 'float', 'ident'].includes(lexRow.token)) {
            this.addRow()
        } else if (lexRow.lexeme == '(') {
            this.isBracket++
            this.addRow()
            this.parseExpression()
            this.parseToken(')', 'brackets_op')

            this.isBracket--
        } else if (lexRow.lexeme == '-'){
            this.setPostfixCode({lexeme:'-', token: 'minus'})
        } else {
            throw `Невідповідність у числовому виразі на ${this.row} рядку`
        }

        if (lexRow.lexeme != '(') {
            this.setPostfixCode(lexRow)
            if(sing){
                this.setPostfixCode({lexeme: sing, token:'int'})
                this.setPostfixCode({lexeme: '*', token:'mult_op'})
            }
        }

        return true
    }

    parseIf() {
        let lexRow = this.getSymb()
        if (lexRow.lexeme == 'if') {
            this.logger('If Statement')
            this.addRow()
            this.parseBoolExpr()
            this.parseToken('then', 'keyword')

            let labNam1 = this.createLabel()
            this.setPostfixCode({lexeme: labNam1, token: 'label'})
            this.setPostfixCode({lexeme: 'JF', token: 'jf'})
            this.logger('Statement List:')
            this.addLevel()
            this.parseStatementList()
            this.subLevel()
            this.parseToken('else', 'keyword')
            let labNam2 = this.createLabel()
            this.setPostfixCode({lexeme: labNam2, token: 'label'})
            this.setPostfixCode({lexeme: 'JMP', token: 'jump'})
            this.setLabelValue(labNam1)
            this.setPostfixCode({lexeme: labNam1, token: 'label'})

            this.logger('Statement List:')
            this.addLevel()
            this.parseStatementList()
            this.subLevel()
            this.parseToken('endif', 'keyword')

            this.setLabelValue(labNam2)
            this.setPostfixCode({lexeme: labNam2, token: 'label'})

            return true
        }
        return false

    }


    parseFor() {
        let lexRow = this.getSymb()
        if (lexRow.lexeme === 'for') {

            this.logger('For Statement')
            this.addRow()
            let iter = this.parseAssign()
            if (typeof iter !== 'string') throw 'Неправильний тип ітератора цикла.'

            let labNam1 = this.createLabel()   //labNam1 - метка для возвращения в начало цикла

            this.parseToken('to', 'keyword')
            this.parseExpression()

            this.setPostfixCode({lexeme: iter, token: 'ident'})
            this.setPostfixCode({lexeme: '>', token: 'rel_op'})
            let labNam2 = this.createLabel()   //labNam1 - метка для завершения цикла
            this.setPostfixCode({lexeme: labNam2, token: 'label'})
            this.setPostfixCode({lexeme: 'JF', token: 'jf'})
            this.setPostfixCode({lexeme: iter, token: 'ident'})
            this.setPostfixCode({lexeme: iter, token: 'ident'})

            this.parseToken('step', 'keyword')
            this.parseExpression()

            this.parseToken('do', 'keyword')
            this.logger('Statement List:')
            this.addLevel()
            this.parseStatementList()
            this.subLevel()
            this.parseToken('next', 'keyword')


            this.setPostfixCode({lexeme: '+', token: 'add_op'})
            this.setPostfixCode({lexeme: '=', token: 'assing_op'})
            this.setPostfixCode({lexeme: labNam1, token: 'label'})
            this.setPostfixCode({lexeme: 'JMP', token: 'jump'})
            this.setLabelValue(labNam2)
        }
    }


    parseFunction() {
        let lexRow = this.getSymb()
        if (lexRow.lexeme == 'echo' || lexRow.lexeme == 'read') {
            this.logger('Read/Echo Statement')
            this.addRow()
            this.parseToken('(', 'brackets_op')

            do {
                this.parseExpression();
                this.setPostfixCode({lexeme: lexRow.lexeme, token: 'func'})
                if (this.getSymb().token !== 'coma') break
                this.addRow()
            } while (true)
            this.parseToken(')', 'brackets_op')
        }
    }


    getPostfixCode() {
        return this.postfixCode
    }

    logger(statement) {
        let tabs = ''

        for (let i = 0; i < this.level; i++) {
            tabs += '\t'
        }

        this.log += `${tabs} ${statement}\n`
        // if (this.isViewPOLIZSteps) console.log(`${tabs} ${statement}`)
    }
}
