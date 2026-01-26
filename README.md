## 📦 Logix: AI-Driven Inventory Management System
Logix is a high-performance warehouse management system (WMS) tailored for the Warehouse. It integrates a modern React/Next.js frontend, a robust Node.js API, and a specialized Python AI module to deliver real-time stock optimization and predictive demand forecasting.

### 🚀 System Architecture
#### Frontend (React/Next.js 14): 
A responsive dashboard featuring real-time data visualization, state management via Context API, and SEO-optimized metadata with OpenGraph support for professional social sharing.

#### Backend (Node.js/Express): 
An orchestrator handling RESTful API requests, secure authentication, and atomic MySQL transactions to ensure data integrity.

#### AI Engine (Python 3): 
A dedicated worker utilizing RandomForestRegressor to transform historical sales_history into actionable demand insights.

### 🛠️ Setup & Installation
#### 1. Database Configuration

ai_inventory_system

#### Initialize Schema: 
Import the provided Create_Table_Queries.sql to create database with all the tables.

#### Populate Data: 
Import InsertQueries.sql to populate initial categories and sample products


#### 2. Backend Setup

``` bash
cd backend
npm install
```
Configure Environment: Create a .env file in the backend/ directory:

``` Code snippet
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=ai_inventory_system
JWT_SECRET=your_super_secret_key
PORT=3001
```
Run Server: 
```
npm run dev
```

#### 3. AI Module Setup

``` Bash
cd ai-module
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Configure Environment: Create a .env file in the ai-module/ directory:

```Code snippet
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=ai_inventory_system
JWT_SECRET=your_super_secret_key
PORT=3001
```

#### 4. Client Setup

```bash
cd client
npm install
```
Configure Environment: Create a .env.local file in the client/ directory:

```Code snippet
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

Run app: 
```
npx next dev
```

#### ⚡ Key Operations & Scripts
#### Historical Data Migration
To sync your historical CSV datasets with the live MySQL environment for AI training, run the migration script:

```
cd backend
node scripts/migrate-history.js
```
This script populates the sales_history table used by the Random Forest model to identify seasonal trends and demand patterns.
