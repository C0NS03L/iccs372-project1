This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## API Routes Documentation

### `GET /api/todo`

**Description:** Fetches tasks due on a specific date.

**Query Parameters:**

- `query_date` (required): The date to query tasks for, in `YYYY-MM-DD` format.

**Example Request:**

```http
GET /api/todo?query_date=2023-10-01
```

**Example Response:**

```json
[
  {
    "id": "1",
    "title": "Task 1",
    "description": "Description for Task 1",
    "completed": false,
    "dueDate": "2023-10-01T00:00:00.000Z",
    "lastPerformed": null,
    "category": "GENERAL"
  }
]
```

### `PATCH /api/todo`

**Description:** Updates the completion status of a task.

**Request Body:**

- `taskId` (required): The ID of the task to update.
- `completed` (required): The new completion status of the task.

**Example Request:**

```json
{
  "taskId": "1",
  "completed": true
}
```

**Example Response:**

```json
{
  "id": "1",
  "title": "Task 1",
  "description": "Description for Task 1",
  "completed": true,
  "dueDate": "2023-10-31T00:00:00.000Z",
  "lastPerformed": "2023-10-01T00:00:00.000Z",
  "category": "MAINTENANCE"
}
```

### `GET /api/task`

**Description:** Fetches all tasks with their titles and completion statuses.

**Example Request:**

```http
GET /api/task
```

**Example Response:**

```json
[
  {
    "title": "Task 1",
    "completed": true
  },
  {
    "title": "Task 2",
    "completed": false
  }
]
```

### `POST /api/task`

**Description:** Creates a new task.

**Request Body:**

- `title` (required): The title of the task.
- `description` (required): The description of the task.
- `completed` (required): The completion status of the task.

**Example Request:**

```json
{
  "title": "New Task",
  "description": "Description for the new task",
  "completed": false
}
```

**Example Response:**

```json
{
  "id": "2",
  "title": "New Task",
  "description": "Description for the new task",
  "completed": false,
  "category": "GENERAL"
}
```

### `POST /api/inventory`

**Description:** Creates a new inventory item with associated maintenance tasks.

**Request Body:**

- `name` (required): The name of the inventory item.
- `description` (required): The description of the inventory item.
- `available` (required): The availability status of the inventory item.
- `stockLevel` (required): The stock level of the inventory item.
- `lowStockThreshold` (required): The low stock threshold for the inventory item.
- `maintenanceTasks` (required): An array of maintenance tasks.

**Example Request:**

```json
{
  "name": "New Equipment",
  "description": "Description for new equipment",
  "available": true,
  "stockLevel": 10,
  "lowStockThreshold": 5,
  "maintenanceTasks": [
    {
      "title": "Maintenance Task 1",
      "description": "Description for maintenance task 1",
      "frequencyDays": 30
    }
  ]
}
```

**Example Response:**

```json
{
  "id": "1",
  "name": "New Equipment",
  "description": "Description for new equipment",
  "available": true,
  "stockLevel": 10,
  "lowStockThreshold": 5,
  "maintenanceTasks": [
    {
      "id": "1",
      "title": "Maintenance Task 1",
      "description": "Description for maintenance task 1",
      "frequencyDays": 30,
      "dueDate": "2023-10-31T00:00:00.000Z",
      "category": "MAINTENANCE"
    }
  ]
}
```

### `GET /api/experiment`

**Description:** Fetches all experiments with their start dates and titles.

**Example Request:**

```http
GET /api/experiment
```

**Example Response:**

```json
[
  {
    "startDate": "2023-10-01T00:00:00.000Z",
    "title": "Experiment 1"
  },
  {
    "startDate": "2023-11-01T00:00:00.000Z",
    "title": "Experiment 2"
  }
]
```

### `POST /api/experiment`

**Description:** Creates a new experiment with associated tasks.

**Request Body:**

- `title` (required): The title of the experiment.
- `description` (required): The description of the experiment.
- `experimentTask` (required): An array of tasks associated with the experiment.
- `startDate` (required): The start date of the experiment.
- `endDate` (required): The end date of the experiment.

**Example Request:**

```json
{
  "title": "New Experiment",
  "description": "Description for new experiment",
  "experimentTask": [
    {
      "title": "Experiment Task 1",
      "description": "Description for experiment task 1"
    }
  ],
  "startDate": "2023-10-01T00:00:00.000Z",
  "endDate": "2023-10-31T00:00:00.000Z"
}
```

**Example Response:**

```json
{
  "id": "1",
  "title": "New Experiment",
  "description": "Description for new experiment",
  "startDate": "2023-10-01T00:00:00.000Z",
  "endDate": "2023-10-31T00:00:00.000Z",
  "experimentTask": [
    {
      "id": "1",
      "title": "Experiment Task 1",
      "description": "Description for experiment task 1",
      "dueDate": "2023-10-01T00:00:00.000Z",
      "category": "EXPERIMENT"
    }
  ]
}
```
