# Flag Debt Dashboard

The Flag Debt Dashboard is a web application that helps you identify and manage stale Split feature flags in your codebase. It provides a centralized view of all feature flags in your workspace and environments those that haven't been updated or seen traffic in a while.

## Features

- List all feature flags 
- Identify stale feature flags based on last update or traffic or creation time
- Click on a column to sort by it. 


## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/Split-Community/flag-debt-dashboard.git

2. Put your API key in a `.env` file 
    ```
    ADMIN_API_KEY=xxx

3. Install dependancies
    ```bash
    npm i

4. Start the app
    ```bash
    node server.js

5. Navigate to `localhost:3000` to view the app

![image](https://github.com/Split-Community/flag-debt-dashboard/assets/1207274/4fb41ee2-aaf0-45ef-9694-ad7259c8e821)


