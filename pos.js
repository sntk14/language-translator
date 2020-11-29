class PostFixAnalizer {
    constructor(postfixCode, identTable, labels, debug) {
        this.postfixCode = postfixCode
        this.labels = labels
        this.identTable = identTable
        this.isView = debug
        this.step = 1
        this.stack = []
    }

    postfixProcess() {
        let length = this.postfixCode.length
        try {
            for (let i = 0; i < length; i++) {
                if (['int', 'float', 'bool', 'ident', 'keyword', 'label'].includes(this.postfixCode[i].token)) {
                    this.stack.push(this.postfixCode[i])
                } else if (['jump', 'jf'].includes(this.postfixCode[i].token)) {
                    i = this.doJump(this.postfixCode[i].token, i)
                } else {
                    this.doIt(this.postfixCode[i], i)
                }
                if (this.isView) {
                    this.viewLog()
                    this.step++
                }
            }
            if (this.isView) {
                this.getIdents()
            }
        } catch (e) {
            //TODO uncomment all

            // if(typeof e == "object"){
            //     console.log('Помилка в трансляції!!')
            // } else {
            console.log(e)
            // }
        }
    }

    getType(n) {
        return Number(n) == n && n % 1 === 0 ? 'int' : 'float'
    }

    checkType(type, oneLast) {
        if (this.getType(oneLast.lexeme) == type.lexeme) return true//типы совпадают
        if (type.lexeme == 'float') return true

        return false
    }


    doIt(el, ind) {
        if (el.lexeme == '=') {
            let oneLast = this.stack.pop()//значение
            let last = this.stack.pop()//имя переменной
            let type = this.stack.pop()//тип


            let types = ['int', 'float', 'bool'];
            //если нет типа, то посмотреть тип уже инициализированой переменной
            if (!type || !types.includes(type.lexeme)) {
                if (!type) {//если переприсваиваем и получаем undefined, скажем, что он объект
                    type = {}
                } else {
                    this.stack.push(type)//извиняюсь, что снял)
                }

                // let types = this.isInteger(Number(oneLast.lexeme)) ? 'int' : 'float'//тип со значения переменной
                // type.lexeme = types
                let ind = this.identTable.findIndex(i => i.value == last.lexeme)
                if (ind < 0 || !this.identTable[ind].typeValue) throw 'Використана невідома змінна'
                type.lexeme = this.identTable[ind].typeValue
            }


            //ДЛЯ ЛОГИЧЕСКИХ ЗНАЧЕНИЙ
            if (String(oneLast.lexeme) == 'true' || String(oneLast.lexeme) == 'false') {
                let ind = this.identTable.findIndex(i => i.value == last.lexeme)
                if (ind < 0) throw 'Використана невідома змінна'
                if (this.identTable[ind].letValue === undefined && type.lexeme === 'bool') {//присвоение
                    this.identTable[ind].letValue = String(oneLast.lexeme)
                    this.identTable[ind].typeValue = type.lexeme
                } else if (this.identTable[ind].typeValue === 'bool') {//переприсвоение
                    this.identTable[ind].letValue = String(oneLast.lexeme)
                } else {
                    throw `Невідповідність типів присвоювання у ${last.row} рядку`
                }
                return true
            }

            //ДЛЯ ЧИСЕЛЬНЫХ ЗНАЧЕНИЙ
            //если переприсвоение, то закинуть тип обратно и взять тип со значения переменной
            if (this.checkType(type, oneLast)) {
                let ind = this.identTable.findIndex(i => i.value == last.lexeme)
                if (ind < 0) throw 'Використана невідома змінна'

                this.identTable[ind].letValue = oneLast.lexeme
                this.identTable[ind].typeValue = type.lexeme
                return true
            } else {
                throw `Невідповідність типів присвоювання у ${last.row} рядку`
            }


            let ind = this.identTable.findIndex(i => i.value == last.lexeme)
            if (ind < 0) throw 'Використана невідома змінна'


        } else if (['add_op', 'mult_op', 'degr_op', 'rel_op'].includes(el.token)) {
            let last = this.stack.pop()
            let oneLast = this.stack.pop()

            last.lexeme = this.isIdent(last)
            oneLast.lexeme = this.isIdent(oneLast)

            let lexeme = 0
            switch (el.lexeme) {
                case '+':
                    lexeme = Number(oneLast.lexeme) + Number(last.lexeme)
                    this.setExpresion(lexeme, last)
                    break
                case '-':
                    lexeme = Number(oneLast.lexeme) - Number(last.lexeme)
                    this.setExpresion(lexeme, last)
                    break
                case '*':
                    lexeme = Number(oneLast.lexeme) * Number(last.lexeme)
                    this.setExpresion(lexeme, last)
                    break
                case '/':
                    if (last.lexeme == 0) throw `Ділення на 0 ${last.row} рядку`
                    lexeme = Number(oneLast.lexeme) / Number(last.lexeme)
                    this.setExpresion(lexeme, last)
                    break
                case '^':
                    lexeme = Math.pow(Number(oneLast.lexeme), Number(last.lexeme))
                    this.setExpresion(lexeme, last)
                    break
                case '>':
                    lexeme = Number(oneLast.lexeme) > Number(last.lexeme)
                    this.setBoolExpression(lexeme, last)
                    break
                case '>=':
                    lexeme = Number(oneLast.lexeme) >= Number(last.lexeme)
                    this.setBoolExpression(lexeme, last)
                    break
                case '<':
                    lexeme = Number(oneLast.lexeme) < Number(last.lexeme)
                    this.setBoolExpression(lexeme, last)
                    break
                case '<=':
                    lexeme = Number(oneLast.lexeme) <= Number(last.lexeme)
                    this.setBoolExpression(lexeme, last)
                    break
                case '==':
                    lexeme = Number(oneLast.lexeme) == Number(last.lexeme)
                    this.setBoolExpression(lexeme, last)
                    break
                case '!=':
                    lexeme = Number(oneLast.lexeme) != Number(last.lexeme)
                    this.setBoolExpression(lexeme, last)
                    break
            }

        }

        return true
    }

    setBoolExpression(lexeme, last) {
        let token = 'bool'
        this.stack.push({token, lexeme, row: last.row})
    }

    setExpresion(lexeme, last) {
        let token = this.getType(lexeme)
        this.stack.push({token, lexeme, row: last.row})
    }

    isIdent(ident) {
        if (ident.token == 'ident') {
            let ind = this.identTable.findIndex(i => i.value == ident.lexeme)

            if (this.identTable[ind].letValue == undefined) throw `Використано неіціалізовану змінну ${ident.row} рядку`

            return this.identTable[ind].letValue
        }
        return ident.lexeme
    }

    getInPOLIZWrire(el) {
        return el.lexeme
    }

    viewLog() {
        console.log(`Крок інтерпретації: ${this.step} \n 
		postfixCode: [${this.postfixCode.map(el => this.getInPOLIZWrire(el))}] \n 
		STACK:[${this.stack.map(el => this.getInPOLIZWrire(el))}]`)
    }

    getIdents() {
        console.log(this.identTable.filter(el => {
            if (el.type == 'ident') {
                return el
            }
        }))
    }


    doJump(token, i) {
        switch (token) {
            case 'jump':
                return this.processing_JUMP(i)
            case 'jf':
                return this.processing_JF(i)
        }
    }

    processing_JUMP(i) {
        let lab = this.stack.pop()
        let label = this.labels.find(l => l.label === lab.lexeme)

        return label.value
    }

    processing_JF(i) {
        //для if
        let lab = this.stack.pop()
        let boolRes = this.stack.pop()
        if (boolRes.lexeme) {//если тру берем это значение, которое проитерируется в цикле на след шаг
            return i
        } else {//если фалс берем значение с следующей метки
            let label = this.labels.find(l => l.label === lab.lexeme)

            return label.value
        }
    }

    isInteger(num) {
        return (num ^ 0) === num;
    }


    getIdentTable() {
        return this.identTable
    }

}