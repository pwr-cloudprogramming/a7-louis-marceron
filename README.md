N.B. I did the beanstalk implementation the previous lab. You can see it on the screenshots of the README:
https://github.com/pwr-cloudprogramming/a5-louis-marceron

# Louis Marceron - Fargate, Beanstalk, TicTacToe report

Course: Cloud programming
Group: 3
Date: 2024-06-9

## Environment Architecture:

Compute
- ECS Fargate services running the frontend and backend applications
- Load Balancer to manage traffic between frontend and backend

Software
- Frontend application running in Bun with the framework Svelte
- Backend application running in Bun
- Both applications are containerized with Docker

Screenshots
![image](https://github.com/pwr-cloudprogramming/a7-louis-marceron/assets/72874947/94940dc8-38e7-43a8-be70-c22ab6cf8346)

Reflections
- Understanding and implementing Fargate services for deploying containerized applications.

What obstacles did you overcome?
- Struggled to link the frontend and backend initially without a Load Balancer. Initially attempted to manually retrieve the backend IP and set it in the frontend environment variables, which was not automated.

What helped most in overcoming obstacles?
- Implementing a Load Balancer to automate the connection between frontend and backend.
- Configuring Terraform to inject the backend IP into the frontend environment variables automatically.

Surprises?
- Found Fargate to be a powerful tool for managing containerized applications, and the use of Load Balancers significantly streamlined the process of linking services.
