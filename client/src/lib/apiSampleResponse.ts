export function getApiSampleResponse(): any {
   const user = [{
                    "user_id": 1,
                    "first_name": "Binaya",
                    "last_name": "Maharjan",
                    "email": "admin@logix.com",
                    "role": "Admin",
                    "active": true,
                    "created_at": "2025-12-21T10:00:00Z"
                },
                {
                    "user_id": 2,
                    "first_name": "Warehouse",
                    "last_name": "Staff",
                    "email": "staff@logix.com",
                    "role": "Staff",
                    "active": true,
                    "created_at": "2025-12-22T09:30:00Z"
                }];
  return user;

}