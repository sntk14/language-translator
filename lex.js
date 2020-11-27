class LexAnalizer {
    constructor(program, file,debug) {
        if (file) {
            const fs = require("fs");
            this.program = fs.readFileSync('simpleS20.txt').toString().trim(),
                console.log(this.program);
        } else {
            this.program = program
        }
        this.debug = debug
        this.consts = [] 									//константи
        this.tokensStream = []								//потік токенів
        this.tableInfo = []									//таблиця з покроковою інформацією
        this.lenghtOfProgram = this.program.length  		//довжина програми
        this.row = 1										//рядок
        this.iterator = 0									//символ
        this.char = null
        this.charType = null
        this.state = 0
        this.lexeme = ''
        this.defTokens = {
            'main': 'keyword',
            'int': 'keyword',
            'float': 'keyword',
            'bool': 'keyword',
            'echo': 'keyword',
            'read': 'keyword',
            'if': 'keyword',
            'then': 'keyword',
            'else': 'keyword',
            'endif': 'keyword',
            'for': 'keyword',
            'to': 'keyword',
            'step': 'keyword',
            'do': 'keyword',
            'next': 'keyword',
            "+": 'add_op',
            "-": 'add_op',
            "*": 'mult_op',
            "/": 'mult_op',
            "^": 'degr_op',
            ")": 'brackets_op',
            "(": 'brackets_op',
            "}": 'brackets_op',
            "{": 'brackets_op',
            "\n": 'nl',
            "=": 'assign_op',
            "==": 'rel_op',
            "!=": 'rel_op',
            ">=": 'rel_op',
            "<=": 'rel_op',
            ">": 'rel_op',
            "<": 'rel_op',
            "true": 'bool',
            "false": 'bool',
            ";": 'end_row',
            ",": 'coma',
            2: 'ident',
            10: 'int',
            14: 'float',
        }


        this.states = {
            "(0,Ws)": 0,
            "(0,Letter)": 1, "(1,Letter)": 1, "(1,Digit)": 1, "(1,other)": 2,
            "(0,relOtherOp)": 27, "(27,AssignOp)": 18, "(27,other)": -1,
            "(0,Digit)": 12, "(12,Digit)": 12, "(12,other)": 10, "(12,dot)": 21,
            "(21,Digit)": 13, "(21,other)": -1,
            "(13,Digit)": 13, "(13,other)": 14, "(13,е)": 22,
            "(22,other)": -1, "(22,AddOp)": 23, "(23,Digit)": 24, "(24,Digit)": 24, "(22,Digit)": 24, "(24,other)": 14,
            "(0,MultOp)": 4, "(0,DegrOp)": 4,
            "(0,AddOp)": 4,
            "(0,AssignOp)": 5, "(5,other)": 17, "(5,AssignOp)": 16,
            "(0,relOperator)": 6, "(6,AssignOp)": 18, "(6,other)": 15,
            "(0,BracketsOp)": 7,
            "(0,EndRow)": 9,
            "(0,Nl)": 8,
            "(0,Coma)": 25,
            "(0,other)": -1,
        }

        this.finalStates = [18, 15, 2, 10, 14, 4, 8, 9, 7, 17, 16, 25, -1]
        this.starStates = [15, 2, 10, 14, 17]
        this.errorStates = [-1]
    }


    lexAnal() {

        while (this.iterator < this.lenghtOfProgram) {
            this.char = this.program[this.iterator]
            this.charType = this.getCharType(this.char)
            this.state = this.getState(this.state, this.charType)

            if (this.isFinal(this.state)) {
                this.processing()
                if (this.state < 0) break
            } else if (this.state === 0) {
                this.lexeme = ''
            } else {
                this.lexeme += this.char
            }

            this.nextChar()
        }
        if (this.debug) {
			console.table(this.consts)
			console.table(this.tokensStream)
		}
        if (!this.errorStates.includes(this.state)) {
            console.log('Лексичний аналiз завершено успiшно!')
        }
    }


    processing() {
        /*
        2: ident*
        10: int*
        14: float*
        4: mathOp
        17: assingOp*
        16: relOp
        15: relOp*
        18: relOp
        7:BracketsOp
        8:Nl
    */
        let token
        if (this.state >= 0) {
            switch (this.state) {
                //End states with* (consts, ident)
                case 2:
                case 10:
                case 14:
                    token = this.getToken(this.state, this.lexeme)
                    if (token !== 'keyword') {
                        this.addConst(this.lexeme)
                    }
                    this.addTokenStream(token)

                    break
                //End states with* (Rel,Assign)
                case 17://=
                case 15:
                    token = this.getToken(this.state, this.lexeme)
                    this.addTokenStream(token)
                    break
                //End states
                case 18:
                case 4:
                case 9:
                case 7:
                case 16:
                case 25:
                    this.lexeme += this.char
                    token = this.getToken(this.state, this.lexeme)
                    this.addTokenStream(token)
                    break

                case 8:
                    this.lexeme += this.char
                    token = this.getToken(this.state, this.lexeme)
                    this.addTokenStream(token)
                    this.row++
                    break
            }

            if (this.starStates.includes(this.state)) this.prevChar()
            this.lexeme = ''
            this.state = 0
        } else {
            this.fail()

        }
    }


    fail() {
        if (this.state === -1) {
            console.log('у рядку ' + this.row + ' неочікуваний символ ' + this.char)
            throw 'Лексичний аналізатор аварійно завершив роботу!'
        }
    }


    addConst() {
        let type = this.getToken(this.state, this.lexeme)

        if (type === 'float') {
            let ind = this.lexeme.indexOf('е');
            if (ind >= 0) {
                this.lexeme = parseFloat(this.lexeme.replace('е', 'e'))
            }
        }

        let ind = this.consts.findIndex((c) => {
                if (c.type === type && c.value === this.lexeme) return c
            }
        )
        if (ind >= 0) {
            this.consts.push({
                type: type,
                value: this.lexeme,
                row: this.row,
                ind: ind,
            })
        } else {
            this.consts.push({
                type: type,
                value: this.lexeme,
                row: this.row,
            })
        }

        return 1
    }

    isFinal(state) {
        return this.finalStates.includes(state) ? true : false
    }

    getToken(state, lexeme) {
        if(state === 10 && parseInt(lexeme) > 0) return this.defTokens[state]
        return this.defTokens[lexeme] ? this.defTokens[lexeme] : this.defTokens[state]
    }

    getCharType(char) {
        let res = ''

        const LLeter = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
            'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
        const ULetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
            'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']


        const AddOp = ['+', '-'] 								 //AddOp
        const DegrOp = ['^']									 //DegrOp
        const MultOp = ['*', '/', ...DegrOp] 					 //MultOp

        const letters = [...LLeter, ...ULetters] 				 //Letter
        const digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'] //Digit
        const ws = ['\t', ' ', '\r'] 									 //Ws
        const dot = ['.'] 										 //dot
        const relOp = ['>', '<',] 							 //RelOp
        const assignOp = ['=']									 //AssignOp
        const bracketsOp = ['{', '}', '(', ')'] 					 //BracketsOp
        const endRow = [';']									 //EndRow
        const coma = [',']									 	 //Coma
        const nl = ['\n']										 //Nl
        const relOtherOp = ['!']										 //Nl
        const e = ['е']											 //e


        if (dot.includes(char)) res = "dot"
        else if (letters.includes(char)) res = "Letter"
        else if (digits.includes(char)) res = "Digit"
        else if (ws.includes(char)) res = "Ws"
        else if (MultOp.includes(char)) res = "MultOp"
        else if (AddOp.includes(char)) res = "AddOp"
        else if (assignOp.includes(char)) res = "AssignOp"
        else if (relOp.includes(char)) res = "relOperator"
        else if (bracketsOp.includes(char)) res = "BracketsOp"
        else if (endRow.includes(char)) res = "EndRow"
        else if (coma.includes(char)) res = "Coma"
        else if (relOtherOp.includes(char)) res = "relOtherOp"
        else if (nl.includes(char)) res = "Nl"
        else if (e.includes(char)) res = "е"
        else res = char

        return res
    }


    getState(state, charType) {
        return this.states[`(${state},${charType})`] !== undefined ? this.states[`(${state},${charType})`] : this.states[`(${state},other)`]
    }

    getConstsTable() {
        return this.consts
    }

    getTokenStreamTable() {
        return this.tokensStream
    }

    addTokenStream(token) {
        let consInTable = this.consts.findIndex(c => c.value === this.lexeme)

        this.tokensStream.push({
            row: this.row,
            lexeme: this.lexeme,
            token: token,
            indConst: consInTable >= 0 ? consInTable : ' '
        })
    }

    prevChar() {
        this.iterator--
    }

    nextChar() {
        this.iterator++
    }
}

