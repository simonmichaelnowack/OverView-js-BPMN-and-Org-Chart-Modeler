import $ from 'jquery';
import { without } from 'min-dash';
import { is } from '../datamodelmodeler/util/ModelUtil';
import { formatStates } from '../util/Util';
import getDropdown from '../util/Dropdown';

export default function GoalStateModeler(container) {
    var root = document.createElement('div');
    root.classList.add('gs-root');
    $(container).get(0).appendChild(root);
    this._root = root;
}

GoalStateModeler.prototype.showGoalState = function (goalState) {
    this.clear();
    this._goalState = goalState;
    if (!goalState) return;
    this._handlers = {
        'disjunction': this.createDisjunctionElement,
        'conjunction': this.createConjunctionElement,
        'literal': this.createLiteralElement
    }
    this.handleStatement(this._root, goalState);
}

GoalStateModeler.prototype.handleStatement = function (parentElement, statement) {
    var element = this._handlers[statement.type || 'literal'].call(this, parentElement, statement);
    statement.element = element;
    element.statement = statement;
    return element;
}

GoalStateModeler.prototype.createDisjunctionElement = function (parentElement, disjunction) {
    var element = this.createOperationElement(parentElement, disjunction);
    var addConjunctionButton = document.createElement('button');
    addConjunctionButton.innerHTML = '+';
    addConjunctionButton.addEventListener('click', event => {
        var newConjunction = { type: 'conjunction', operands: [] };
        disjunction.operands.push(newConjunction);
        element.addOperand(newConjunction);
    });
    element.appendChild(addConjunctionButton);
    return element;
}

GoalStateModeler.prototype.createConjunctionElement = function (parentElement, conjunction) {
    var element = this.createOperationElement(parentElement, conjunction);
    var addLiteralButton = document.createElement('button');
    addLiteralButton.innerHTML = '+';
    addLiteralButton.addEventListener('click', event => {
        var newLiteral = { type: 'literal', class: this.getClassList()[0], states: [] };
        conjunction.operands.push(newLiteral);
        element.addOperand(newLiteral);
    });
    element.appendChild(addLiteralButton);
    return element;
}

GoalStateModeler.prototype.createOperationElement = function (parentElement, operation) {
    var element = document.createElement('div');
    element.classList.add('gs-operation');
    element.classList.add('gs-' + operation.type);

    var operandsElement = document.createElement('div');
    operandsElement.classList.add('gs-operands');
    element.appendChild(operandsElement);
    element.operandsElement = operandsElement;

    element.addOperand = (operand) => {
        operand.parent = operation; //TODO maybe use moddle later, which has a parent function
        var operandElement = this.handleStatement(operandsElement, operand);
        operandElement.classList.add('operand');

        var deleteButton = document.createElement('button');
        deleteButton.innerHTML = 'x';
        deleteButton.addEventListener('click', event => {
            this.deleteStatement(operand);
        });
        operandElement.appendChild(deleteButton);
    }
    operation.operands.forEach(element.addOperand);
    parentElement.appendChild(element);
    return element;
}

GoalStateModeler.prototype.createLiteralElement = function (parentElement, literal) {
    var element = document.createElement('div');
    element.classList.add('gs-literal');
    var classElement = makeDiv('', 'gs-dataclass');
    element.appendChild(classElement);
    element.classElement = classElement;
    var stateElement = makeDiv('', 'gs-datastate');
    element.appendChild(stateElement);
    element.stateElement = stateElement;
    parentElement.append(element);

    classElement.dropdown = getDropdown();
    stateElement.dropdown = getDropdown();

    this.populateLiteral(literal, element);

    return element;
}

GoalStateModeler.prototype.populateLiteral = function (literal, element) {
    var { classElement, stateElement } = element;

    classElement.innerText = literal.class.name;
    classElement.dropdown.innerHTML = '';
    classElement.addEventListener('mouseenter', event => {
        classElement.dropdown.populate(
            without(this.getClassList(), literal.class),
            (clazz, element) => this.changeClass(clazz, literal)
        );
        classElement.dropdown.style.display = 'block';
    });
    classElement.addEventListener('mouseleave', event => {
        classElement.dropdown.innerHTML = '';
        classElement.dropdown.style.display = 'none';
    });
    classElement.appendChild(classElement.dropdown);

    stateElement.innerText = formatStates(literal.states);    
    stateElement.dropdown.innerHTML = '';
    stateElement.addEventListener('mouseenter', event => {
        const updateStateSelection = () => {
            stateElement.dropdown.getEntries().forEach(entry => entry.setSelected(literal.states.includes(entry.option)));
        }
        stateElement.dropdown.populate(
            this.getStateList(literal.class),
            (state, element) => {
                this.toggleState(state, literal);
                updateStateSelection();
            }
        );
        updateStateSelection();
        stateElement.dropdown.style.display = 'block';
    });
    stateElement.addEventListener('mouseleave', event => {
        stateElement.dropdown.innerHTML = '';
        stateElement.dropdown.style.display = 'none';
    });
    stateElement.appendChild(stateElement.dropdown);
}

GoalStateModeler.prototype.clear = function () {
    var root = this._root;
    while (root.firstChild) root.removeChild(root.lastChild);
}

GoalStateModeler.prototype.changeClass = function (clazz, literal) {
    if (literal.class !== clazz) {
        literal.class = clazz;
        literal.states = [];
        this.populateLiteral(literal, literal.element);
    }
}

GoalStateModeler.prototype.toggleState = function (state, literal) {
    if (literal.states.includes(state)) {
        literal.states = without(literal.states, state);
    } else {
        literal.states.push(state);
    }
    this.populateLiteral(literal, literal.element);
}

GoalStateModeler.prototype.deleteStatement = function (statement) {
    var element = statement.element;
    var parentStatement = statement.parent;
    var parentElement = parentStatement.element;
    parentStatement.operands = without(parentStatement.operands, statement);
    parentElement.operandsElement.removeChild(element);
}

GoalStateModeler.prototype.handleStatesChanged = function (clazz, newStates) {
    //TODO
}

GoalStateModeler.prototype.handleOlcListChanged = function (classes) {
    this._classList = classes;
    if (this._goalState) {
        var literalsToDelete = [];
        this.forEachLiteral(literal => {
            if (!classes.includes(literal.class)) {
                literalsToDelete.push(literal);
            } else {
                this.populateLiteral(literal, literal.element);
            }
        });
        literalsToDelete.forEach(literal => this.deleteStatement(literal));
        return {literalsToDelete};
    } else {
        return {literalsToDelete : []};
    }
}

GoalStateModeler.prototype.getLiteralsWithClassId = function (id) {
    var literalsOfClass = [];
    this.forEachLiteral(literal => {
        if (literal.class.id === id) {
            literalsOfClass.push(literal);
        }
    });
    return literalsOfClass;
}

GoalStateModeler.prototype.handleStateRenamed = function (state) {
    this.forEachLiteral(literal => {
        if (literal.states.includes(state)) {
            this.populateLiteral(literal, literal.element);
        }
    });
}

GoalStateModeler.prototype.handleStateDeleted = function (state) {
    this.forEachLiteral(literal => {
        if (literal.states.includes(state)) {
            literal.states = without(literal.states, state);
            this.populateLiteral(literal, literal.element);
        }
    });
}

GoalStateModeler.prototype.forEachLiteral = function(consumer) {
    var statementsToVisit = [this._goalState];
    while (statementsToVisit.length > 0) {
        var nextStatement = statementsToVisit.shift();
        if (nextStatement.type === 'literal') {
            consumer(nextStatement);
        } else {
            statementsToVisit.push(...nextStatement.operands);
        }
    }
}

GoalStateModeler.prototype.getClassList = function () {
    return this._classList || [];
}

GoalStateModeler.prototype.getStateList = function (clazz) {
    return clazz.get('Elements').filter(element => is(element, 'olc:State'));
}


function makeDiv(text, ...classes) {
    var element = document.createElement('div');
    element.innerHTML = text;
    classes.forEach(clazz => element.classList.add(clazz));
    return element;
}