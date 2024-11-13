\c employees_db;

SELECT * FROM department;

SELECT role.id, role.title, department.name as department, role.salary
FROM role
JOIN department
ON department.id= role.department_id;

SELECT employee.id, employee.first_name, employee.last_name, 
role.title, department.name as department, role.salary, CONCAT (employee_manager.first_name, ' ', employee_manager.last_name) as manager
FROM employee
LEFT JOIN role ON role.id = employee.role_id
LEFT JOIN department ON department.id = role.department_id
LEFT JOIN employee as employee_manager ON employee.manager_id= employee_manager.id order by employee.id;