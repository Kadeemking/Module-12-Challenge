const inquirer = require('inquirer');
const { printTable } = require('console-table-printer');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool(
    {
        user: process.env.USER_NAME,
        password: process.env.PASSWORD,
        host: 'localhost',
        database: process.env.DBNAME
    },
    console.log(`Connected to the employees_db database.`)
)

pool.connect(() => {
    mainMenu();
});

function mainMenu() {
    inquirer
        .prompt([
            {
                type: "list",
                message: "What would you like to do?",
                name: "menu",
                choices: [
                    "View all departments",
                    "View all roles",
                    "View all employees",
                    "Add a department",
                    "Add a role",
                    "Add an employee",
                    "Update an employee role",
                    "Delete a department",
                    "Delete a role",
                    "Delete an employee",
                    "Quit"
                ]
            }
        ])
        .then(response => {
            if (response.menu === "View all departments") {
                viewDepartments()
            }
            else if (response.menu === "Add a department") {
                addDepartment()
            }
            else if (response.menu === "Delete a department") {
                deleteDepartment()
            }
            else if (response.menu === "View all roles") {
                viewRoles()
            }
            else if (response.menu === "Add a role") {
                addRole()
            }
            else if (response.menu === "Delete a role") {
                deleteRole()
            }
            else if (response.menu === "View all employees") {
                viewEmployees()
            }
            else if (response.menu === "Add an employee") {
                addEmployee()
            }
            else if (response.menu === "Delete an employee") {
                deleteEmployee()
            }
            else if (response.menu === "Update an employee role") {
                updateEmployeeRole();
            }
            else if (response.menu === "Quit") {
                console.log("Goodbye!");
                process.exit();
            }
        })
};

function updateEmployeeRole() {
    pool.query("SELECT CONCAT(first_name,' ',last_name ) as name, id as value from employee", (err, { rows }) => {
        if (err) {
            console.error('Error fetching employees:', err.message);
            return mainMenu();
        }
        pool.query("SELECT title as name, id as value from role", (err, { rows: roleRows }) => {
            if (err) {
                console.error('Error fetching roles:', err.message);
                return mainMenu();
            }
            inquirer.prompt([
                {
                    type: "list",
                    message: "Which employee's do you want to update?",
                    name: "employee",
                    choices: rows
                }, {
                    type: "list",
                    message: "Which role do you want to assign to the selected employee?",
                    name: "role",
                    choices: roleRows
                }
            ])
                .then(res => {
                    pool.query(`update employee set role_id = ${res.role} where id=${res.employee}`, (err) => {
                        if (err) {
                            console.error("Error updating employee's role:", err.message);
                        } else {
                            console.log("Employee's role has been updated!")
                            viewEmployees();
                        }
                    })
                })
        })
    })
};

function addEmployee() {
    pool.query("SELECT title as name, id as value from role", (err, { rows }) => {
        if (err) {
            console.error('Error fetching roles:', err.message);
            return mainMenu();
        }
        pool.query("SELECT CONCAT(first_name,' ',last_name ) as name, id as value from employee ", (err, { rows: managerRows }) => {
            if (err) {
                console.error('Error fetching managers:', err.message);
                return mainMenu();
            }
            inquirer
                .prompt([
                    {
                        type: "input",
                        message: "What is the employee's first name?",
                        name: "first_name"
                    },
                    {
                        type: "input",
                        message: "What is the employee's last name?",
                        name: "last_name"
                    },
                    {
                        type: "list",
                        message: "What is the employee's role?",
                        name: "role",
                        choices: rows
                    },
                    {
                        type: "list",
                        message: "Who is the employee's manager?",
                        name: "manager",
                        choices: [{name: "None", value: null}, ...managerRows
                        ]
                    }
                ])
                .then(res => {
                    pool.query(`insert into employee (first_name, last_name, role_id,manager_id)
            values('${res.first_name}','${res.last_name}', ${res.role},${res.manager})`, (err) => {
                        if (err) {
                            console.error('Error adding employee:', err.message);
                        } else {
                            console.log("New employee has been added into system!")
                            viewEmployees();
                        }
                    })
                })
        })
    })
};

function viewEmployees() {
    pool.query(`SELECT employee.id, employee.first_name,employee.last_name,
  role.title, department.name as department, role.salary, CONCAT(employee_manager.first_name,' ' ,   employee_manager.last_name) as manager
  FROM employee
  LEFT JOIN role ON role.id = employee.role_id
  LEFT JOIN department ON department.id = role.department_id
  LEFT JOIN employee as employee_manager ON employee.manager_id=employee_manager.id order by employee.id`, (err, { rows }) => {
        if (err) {
            console.error('Error fetching employees:', err.message);
            return mainMenu();
        }
        printTable(rows);
        mainMenu();
    })
};

function deleteEmployee() {
    pool.query("SELECT CONCAT(first_name, ' ', last_name) AS name, id AS value FROM employee", (err, { rows }) => {
        if (err) {
            console.error('Error fetching employees:', err.message);
            return mainMenu();
        }

        inquirer.prompt([
            {
                type: "list",
                message: "Select the employee to delete:",
                name: "employee",
                choices: rows,
            },
        ])
            .then(({ employee }) => {
                pool.query("DELETE FROM employee WHERE id = $1", [employee], (err) => {
                    if (err) {
                        console.error('Error deleting employee:', err.message);
                    } else {
                        console.log("Employee deleted successfully!");
                    }
                    viewEmployees();
                });
            });
    });
}

function addRole() {
    pool.query('SELECT name AS name, id AS value FROM department', (err, { rows }) => {
        if (err) {
            console.error('Error fetching departments:', err.message);
            return mainMenu();
        }
        inquirer
            .prompt([
                {
                    type: 'input',
                    message: 'What is the name of the role?',
                    name: 'title',
                },
                {
                    type: 'input',
                    message: 'What is the salary for this role?',
                    name: 'salary',
                    validate: (input) => {
                        if (isNaN(input) || input <= 0) {
                            return 'Please enter a valid positive number for salary.';
                        }
                        return true;
                    },
                },
                {
                    type: 'list',
                    message: 'Which department does this role belong to?',
                    name: 'department_id',
                    choices: rows,
                },
            ])
            .then((res) => {
                pool.query(`INSERT INTO role (title, salary, department_id)
                values('${res.title}','${res.salary}', ${res.department_id})`, (err) => {
                    if (err) {
                        console.error('Error adding role:', err.message);
                    } else {
                        console.log('New role added successfully!');
                        viewRoles();
                    }
                });
            });
    });
};

function viewRoles() {
    pool.query(`SELECT role.id, role.title, department.name AS department, role.salary
    FROM role
    JOIN department ON department.id = role.department_id
    ORDER BY role.id;`, (err, { rows }) => {
        if (err) {
            console.error('Error fetching roles:', err.message);
            return mainMenu();
        }
        printTable(rows);
        mainMenu();
    });
};

function deleteRole() {
    pool.query("SELECT title AS name, id AS value FROM role", (err, { rows }) => {
        if (err) {
            console.error('Error fetching roles:', err.message);
            return mainMenu();
        }

        inquirer.prompt([
            {
                type: "list",
                message: "Select the role to delete:",
                name: "role",
                choices: rows,
            },
        ])
            .then(({ role }) => {
                pool.query("DELETE FROM role WHERE id = $1", [role], (err) => {
                    if (err) {
                        console.error('Error deleting role:', err.message);
                    } else {
                        console.log("Role deleted successfully!");
                    }
                    viewRoles();
                });
            });
    });
}

function addDepartment() {
    inquirer
        .prompt([
            {
                type: 'input',
                message: 'What is the name of the new department?',
                name: 'name',
            },
        ])
        .then((res) => {
            pool.query(`INSERT INTO department (name)
        VALUES ('${res.name}')`, (err) => {
                if (err) {
                    console.error('Error adding department:', err.message);
                } else {
                    console.log('New department added successfully!');
                    viewDepartments();
                }
            });
        });
};

function viewDepartments() {
    pool.query("SELECT * FROM department", (err, { rows }) => {
        if (err) {
            console.error('Error fetching departments:', err.message);
            return mainMenu();
        }
        printTable(rows);
        mainMenu();
    })
};

function deleteDepartment() {
    pool.query("SELECT name AS name, id AS value FROM department", (err, { rows }) => {
        if (err) {
            console.error('Error fetching departments:', err.message);
            return mainMenu();
        }

        inquirer.prompt([
            {
                type: "list",
                message: "Select the department to delete:",
                name: "department",
                choices: rows,
            },
        ])
            .then(({ department }) => {
                pool.query("DELETE FROM department WHERE id = $1", [department], (err) => {
                    if (err) {
                        console.error('Error deleting department:', err.message);
                    } else {
                        console.log("Department deleted successfully!");
                    }
                    viewDepartments();
                });
            });
    });
}
