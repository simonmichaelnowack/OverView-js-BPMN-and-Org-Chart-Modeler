import $ from 'jquery';
import { without } from 'min-dash';

var dummyStateList = {
    'Paper' : ['In Review', 'Accepted', 'Rejected'],
    'Conference' : ['In Planning', 'Planned', 'Canceled'],
    'Decision' : ['Scheduled', 'Done'],
    'Unicorn' : ['Vanished', 'Found']
}

export default function GoalStateModeler(container) {
    var root = document.createElement('div');
    root.classList.add('gs-root');
    $(container).get(0).appendChild(root);
    this._root = root;
}

GoalStateModeler.prototype.showGoalStatement = function(goalStatement) {
    this.clear();
    this._goalStatement = goalStatement;
    if (!goalStatement) return;
    this._handlers = {
        'disjunction': this.createDisjunctionElement,
        'conjunction': this.createConjunctionElement,
        'literal': this.createLiteralElement
    }
    this.handleStatement(this._root, goalStatement);
}

GoalStateModeler.prototype.handleStatement = function(parentElement, statement) {
    var element = this._handlers[statement.type || 'literal'].call(this, parentElement, statement);
    statement.element = element;
    element.statement = statement;
    return element;
}

GoalStateModeler.prototype.createDisjunctionElement = function(parentElement, disjunction) {
    var element = this.createOperationElement(parentElement, disjunction);
    var addConjunctionButton = document.createElement('button');
    addConjunctionButton.innerHTML = '+';
    addConjunctionButton.addEventListener('click', event => {
        var newConjunction = { type: 'conjunction', operands: [] };
        disjunction.operands.push(newConjunction);
        element.addOperand(newConjunction);
        // Put button to end again
        element.removeChild(addConjunctionButton);
        element.appendChild(addConjunctionButton);
    });
    element.appendChild(addConjunctionButton);
    return element;
}

GoalStateModeler.prototype.createConjunctionElement = function(parentElement, conjunction) {
    var element = this.createOperationElement(parentElement, conjunction);
    var addLiteralButton = document.createElement('button');
    addLiteralButton.innerHTML = '*';
    addLiteralButton.addEventListener('click', event => {
        var newLiteral = {type: 'literal', class: Object.keys(dummyStateList)[0], states: []};
        conjunction.operands.push(newLiteral);
        element.addOperand(newLiteral);
        // Put button to end again
        element.removeChild(addLiteralButton);
        element.appendChild(addLiteralButton);
    });
    element.appendChild(addLiteralButton);
    return element;
}

GoalStateModeler.prototype.createOperationElement = function(parentElement, operation) {
    var element = document.createElement('div');
    element.classList.add('gs-operation');
    element.classList.add('gs-' + operation.type);
    element.addOperand = (operand) => {
        var operandElement = this.handleStatement(element, operand);
        if (operand === operation.operands[0]) operandElement.classList.add('first');
        operandElement.classList.add('operand');
        
        var deleteButton = document.createElement('button');
        deleteButton.innerHTML = 'x';
        deleteButton.addEventListener('click', event => {
            this.deleteStatement(operation, operand);
        });
        operandElement.appendChild(deleteButton);
    }
    operation.operands.forEach(element.addOperand);
    parentElement.appendChild(element);
    return element;
}

GoalStateModeler.prototype.createLiteralElement = function(parentElement, literal) {
    var element = document.createElement('div');
    element.classList.add('gs-literal');
    var classElement = makeSpan('', 'gs-dataclass');
    element.appendChild(classElement);
    element.classElement = classElement;
    var stateElement = makeSpan('', 'gs-datastate');
    element.appendChild(stateElement);
    element.stateElement = stateElement;
    parentElement.append(element);

    var classDropDownMenu = document.createElement('div');
    classDropDownMenu.classList.add('gs-dropdown-menu');
    for(var clazz of Object.keys(dummyStateList)) {
        var entry = document.createElement('div');
        const innerClass = clazz;
        entry.classList.add('gs-dropdown-entry');
        entry.innerHTML = clazz;
        entry.addEventListener('click', event => {
            this.changeClass(innerClass, literal);
        });
        classDropDownMenu.appendChild(entry);
    }
    // classElement.appendChild(classDropDownMenu);
    classElement.dropdown = classDropDownMenu;

    var stateDropDownMenu = document.createElement('div');
    stateDropDownMenu.classList.add('gs-dropdown-menu');
    for(var state of dummyStateList[literal.class]) {
        var entry = document.createElement('div');
        const innerState = state;
        entry.classList.add('gs-dropdown-entry');
        entry.innerHTML = state;
        entry.addEventListener('click', event => {
            this.toggleState(innerState, literal);
        });
        stateDropDownMenu.appendChild(entry);
    }
    // stateElement.appendChild(stateDropDownMenu);
    stateElement.dropdown = stateDropDownMenu;

    this.populateLiteral(literal, element);

    return element;
}

GoalStateModeler.prototype.populateLiteral = function(literal, element) {
    var {classElement, stateElement} = element;
    classElement.innerHTML = literal.class;
    classElement.appendChild(classElement.dropdown);
    stateElement.innerHTML = '[' + literal.states.join('|') + ']';
    stateElement.appendChild(stateElement.dropdown);
}

GoalStateModeler.prototype.clear = function() {
    var root = this._root;
    while(root.firstChild) root.removeChild(root.lastChild);
}

GoalStateModeler.prototype.changeClass = function(clazz, literal) {
    literal.class = clazz;
    literal.states = [];
    this.populateLiteral(literal, literal.element);
}

GoalStateModeler.prototype.toggleState = function(state, literal) {
    if (literal.states.includes(state)) {
        literal.states = without(literal.states, state);
    } else {
        literal.states.push(state);
    }
    console.log(literal.states);
    this.populateLiteral(literal, literal.element);
}

GoalStateModeler.prototype.deleteStatement = function(parentStatement, statement) {
    var element = statement.element;
    var parentElement = parentStatement.element;
    parentStatement.operands = without(parentStatement.operands, statement);
    parentElement.removeChild(element);
}

GoalStateModeler.prototype.handleStatesChanged = function(clazz, newStates) {
    //TODO
}

GoalStateModeler.prototype.handleClassesChanged = function(classes) {
    //TODO
}


function makeSpan(text, ...classes) {
    var element = document.createElement('div');
    element.innerHTML = text;
    classes.forEach(clazz => element.classList.add(clazz));
    return element;
}

export var dummyGoalState = {
    type: 'disjunction',
    operands: [
        {
            type: 'conjunction',
            operands: [
                {type: 'literal', class: 'Paper', states: ['Accepted', 'Rejected']},
                {type: 'literal', class: 'Conference', states: ['Planned']},
                {type: 'literal', class: 'Decision', states: ['Done']}
            ]
        },
        {
            type: 'conjunction',
            operands: [
                {type: 'literal', class: 'Paper', states: ['Accepted', 'Rejected']},
                {type: 'literal', class: 'Conference', states: ['Canceled']},
                {type: 'literal', class: 'Decision', states: ['Done']}
            ]
        },
        {
            type: 'conjunction',
            operands: [
                {type: 'literal', class: 'Unicorn', states: ['Found']}
            ]
        },
    ]
}