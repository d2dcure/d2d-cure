import React, { useState, useEffect } from 'react';
import "../../app/globals.css";
import { useUser } from '@/components/UserProvider';
import NavBar from '@/components/NavBar';
import { getAuth, deleteUser } from "firebase/auth";
import { auth } from "firebase-admin";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell
} from "@nextui-org/table";
import { useAsyncList } from "@react-stately/data";
import { Button, Link, Checkbox, Input, Pagination } from "@nextui-org/react";
import StatusChip from '@/components/StatusChip';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { Breadcrumbs, BreadcrumbItem } from "@nextui-org/breadcrumbs";
import { AuthChecker } from '@/components/AuthChecker';

function UserManagement() {
  const [institutions, setInstitutionsList] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [checkedUsers, setCheckedUsers] = useState<{ [key: number]: boolean }>({});
  const { user, loading } = useUser();
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: string }>({ key: '', direction: '' });
  const [isScrolling, setIsScrolling] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(true);
  const [scrollDirection, setScrollDirection] = useState<'top' | 'bottom' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [sortField, setSortField] = useState('id');
  const [sortDirection, setSortDirection] = useState('asc');

  interface Column {
    name: string;
    uid: string;
    sortable: boolean;
    width: string;
  }
  
  const columns: Column[] = [
    { name: "Username", uid: "user_name", sortable: true, width: "40" },
    { name: "Given Name", uid: "given_name", sortable: true, width: "40" },
    { name: "Title", uid: "title", sortable: true, width: "40" },
    { name: "Institution", uid: "institution", sortable: true, width: "40" },
    { name: "Status/Role", uid: "status", sortable: true, width: "40" },
    { name: "PI", uid: "pi", sortable: true, width: "40" },
    { name: "Email", uid: "email", sortable: true, width: "40" },
    { name: "Alt. Email", uid: "alt_email", sortable: true, width: "40" },
    { name: "Registered Date", uid: "registered_date", sortable: true, width: "40" },
    { name: "Approved", uid: "approved", sortable: true, width: "40" },
  ];
  
interface User {
  user_name: string;
  given_name: string;
  title: string;
  institution: string;
  status: string;
  pi: string;
  email: string;
  alt_email: string;
  registered_date: string;
  approved: boolean;
}

// Fix the useAsyncList hook to work with the paginated API response
const list = useAsyncList<User>({
  async load({ signal }) {
    const res = await fetch('/api/getAllUsers', { signal });
    const response = await res.json();
    // Extract the users array from the paginated response
    return { items: response.users || [] };
  },

  async sort({ items, sortDescriptor }) {
    const column = sortDescriptor.column as keyof User;
    
    // Ensure column is defined before sorting
    if (typeof column === 'undefined') {
      return { items };
    }
  
    // Sorting logic
    const sortedItems = items.sort((a, b) => {
      const first = a[column];  // Now TypeScript knows `a[column]` is valid
      const second = b[column]; // Same for `b[column]`

      let cmp = 0;
      if (first < second) {
        cmp = -1;
      } else if (first > second) {
        cmp = 1;
      }

      // Reverse the comparison if sorting is in descending order
      if (sortDescriptor.direction === 'descending') {
        cmp *= -1;
      }

      return cmp;
    });

    return { items: sortedItems };
  },
});


  useEffect(() => {
    const fetchData = async () => {
      setError(null); // Clear any previous errors
      setIsLoading(true);
      
      try {
        // Fetch institutions
        const institutionsResponse = await fetch('/api/getInstitutions');
        if (!institutionsResponse.ok) {
          throw new Error(`Failed to fetch institutions: ${institutionsResponse.statusText}`);
        }
        const institutionsData = await institutionsResponse.json();
        setInstitutionsList(institutionsData);
        
        // Fetch users
        const institutionParam = user?.status === "ADMIN" ? '' : `&institution=${encodeURIComponent(user.institution)}`;
        const url = `/api/getAllUsers?page=${page}&pageSize=${pageSize}${institutionParam}&sortField=${sortField}&sortDirection=${sortDirection}`;
        
        const usersResponse = await fetch(url);
        if (!usersResponse.ok) {
          throw new Error(`Failed to fetch users: ${usersResponse.statusText}`);
        }
        const usersData = await usersResponse.json();
        setAllUsers(usersData.users);
        setTotalPages(usersData.pagination.pages);
        setTotalUsers(usersData.pagination.total);
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [page, pageSize, user, sortField, sortDirection]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollToBottom(window.scrollY < 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToPosition = (position: 'top' | 'bottom') => {
    setIsScrolling(true);
    setScrollDirection(position);
    
    if (position === 'top') {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } else {
      const tableElement = document.getElementById('user-management-table');
      if (tableElement) {
        const tableBottom = tableElement.getBoundingClientRect().bottom;
        const windowHeight = window.innerHeight;
        const scrollTarget = window.pageYOffset + tableBottom - windowHeight + 100;
        
        window.scrollTo({
          top: scrollTarget,
          behavior: 'smooth'
        });
      }
    }

    setTimeout(() => {
      setIsScrolling(false);
      setScrollDirection(null);
    }, 1000);
  };

  if (loading) {
      return <p>Loading</p>
  }

  //filter users based on university name unless user is ADMIN
  const filteredUsers: any[] = [];
  if (user?.status === "ADMIN") {
    // Show all users for admin users
    filteredUsers.push(...allUsers);
  } else {
    // For non-admin users, only show users from their institution
    for(let i = 0; i<allUsers.length; i++){
      if(user.institution == allUsers[i].institution){
        filteredUsers.push(allUsers[i]);
      }
    }
  }
  console.log("Filtered Users", filteredUsers);

    // Sorting function
const sortTable = (key: string) => {
  let direction = 'asc';
  if (sortField === key && sortDirection === 'asc') {
    direction = 'desc';
  }
  setSortField(key);
  setSortDirection(direction);
  setPage(1); // Reset to first page when sorting changes
};
  
const sortedUsers = [...filteredUsers].sort((a, b) => {
  if (sortConfig.key && a[sortConfig.key] !== undefined && b[sortConfig.key] !== undefined) {
    const valueA = a[sortConfig.key];
    const valueB = b[sortConfig.key];

    // Check if values are numerical
    const isNumeric = !isNaN(valueA) && !isNaN(valueB);
    if (isNumeric) {
      // Numerical comparison
      return sortConfig.direction === 'asc'
        ? valueA - valueB
        : valueB - valueA;
    } else {
      // String comparison (case-sensitive)
      if (valueA < valueB) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
    }
  }
  return 0;
});


  const handleCheckboxChange = (userId: number) => {
    setCheckedUsers((prevState) => ({
      ...prevState,
      [userId]: !prevState[userId],
    }));
  };

  const handleApprove = async () => {
    const updatedUsers = allUsers.map((user) => ({
      ...user,
      approved: checkedUsers[user.id] ? true : user.approved,
    }));

    setAllUsers(updatedUsers);
    try {
      const updatedUsers = await Promise.all(
        Object.keys(checkedUsers).map(async (userIdKey: string) => {
          const userId = parseInt(userIdKey); 
          await fetch('/api/approveUsers', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              checkedUsers: {
                [userId]: checkedUsers[userId], 
              },
            }),
          });
          return {
            id: userId,
            approved: checkedUsers[userId],
          };
        })
      );
  
      console.log("Updated Users: ", updatedUsers);
    } catch (error) {
      console.error('Error approving user:', error);
    }
  

  
    };

  const handleDelete = async () => {
    //only fill array with users that are not checked
    const updatedUsers = allUsers.filter(user => !checkedUsers[user.id]);
    setAllUsers(updatedUsers);

    try {
      const deletedUsers = await fetch('/api/deleteUsers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          checkedUsers,
        }),
      }).then(res => res.json());
  
      console.log("Deleted Users: ", deletedUsers);
      
  
    } catch (error) {
      console.error('Error deleting users:', error);
    }
  };

const handleDeleteFirebase = async () => {
    const usersToDelete = Object.keys(checkedUsers)
      .filter((userId: string) => checkedUsers[parseInt(userId, 10)]);

      const userEmails = usersToDelete.map(userId => {
        const user = allUsers.find(u => u.id === parseInt(userId, 10));
        return user ? user.email : null;
      });
    
      const validEmails = userEmails.filter(email => email !== null);
    
      console.log('User Emails:', validEmails);

    

    try {
      const response = await fetch('/api/firebaseDelete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ usersToDelete, validEmails }),
      });
      if (response.ok) {
        console.log('Users deleted successfully');
      } else {
        console.error('Failed to delete users:', await response.text());
      }
    } catch (error) {
      console.error('Error deleting users:', error);
    }
  };

  const filteredAndSortedUsers = [...filteredUsers]
  .filter((user) =>
    user.given_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )
  .sort((a, b) => {
    if (sortConfig.key) {
      const valueA = a[sortConfig.key];
      const valueB = b[sortConfig.key];

      // Handle null or undefined values
      if ((valueA == null && valueB == null) || (valueA == "" && valueB == "")) return 0; // Both are null/undefined
      if (valueA == null || valueA== "") return sortConfig.direction === 'asc' ? 1 : -1; // Null/undefined goes last
      if (valueB == null || valueB == "") return sortConfig.direction === 'asc' ? -1 : 1; // Null/undefined goes last

      const valueAStr = valueA.toString().toLowerCase(); // Convert to string and lowercase
      const valueBStr = valueB.toString().toLowerCase(); // Convert to string and lowercase

      // Check if values are numerical
      const isNumeric = !isNaN(valueA) && !isNaN(valueB);
      if (isNumeric) {
        return sortConfig.direction === 'asc'
          ? valueA - valueB
          : valueB - valueA;
      } else {
        // String comparison
        if (valueAStr < valueBStr) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (valueAStr > valueBStr) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
      }
    }
    return 0;
  });

  return (
    <AuthChecker minimumStatus="professor">
      <NavBar />
      <div className="px-3 md:px-4 lg:px-15 py-4 lg:py-10 mb-10 bg-white">
        {error && (
          <div></div>
          // optionally display error as UI here. For now im not 
        )}

        <div className="max-w-7xl mx-auto">
          <Breadcrumbs className="mb-4">
            <BreadcrumbItem href="/">Home</BreadcrumbItem>
            <BreadcrumbItem href="/user-settings">User Settings</BreadcrumbItem>
            <BreadcrumbItem>User Management</BreadcrumbItem>
          </Breadcrumbs>

          <div className="pt-3">
            <h1 className="mb-4 text-4xl md:text-4xl lg:text-4xl font-inter dark:text-white">
              User Management
            </h1>
            <p className="text-gray-500 mb-8">
              {user?.status === "ADMIN" 
                ? "Members of labs across all institutions" 
                : `Members of labs at ${user.institution}`}
            </p>

<div className="flex justify-between items-center gap-4 mb-4">
    <Input
    isClearable
    classNames={{
      base: "w-full sm:w-[200px] md:w-[300px]",
    }}
    placeholder="Search for given name..."
    size="sm"
    value={searchTerm}
    onClear={() => setSearchTerm("")}
    onValueChange={(value) => setSearchTerm(value)}
    startContent={
      <svg
        aria-hidden="true"
        fill="none"
        focusable="false"
        height="1em"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        width="1em"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" x2="16.65" y1="21" y2="16.65" />
      </svg>
    }
  />
  <div className="flex gap-2">
    <Button
      color="danger"
      variant="bordered"
      onClick={() => {
        handleDeleteFirebase();
        handleDelete();
      }}
      className="rounded-lg text-sm"
    >
      Remove User
    </Button>
    <Button
      className="bg-[#06B7DB] text-white rounded-lg text-sm"
      onClick={handleApprove}
    >
      Approve
    </Button>
  </div>


</div>


            <div id="user-management-table">
              <Table
                aria-label="Members Table"
                sortDescriptor={list.sortDescriptor}
                onSortChange={list.sort}
                classNames={{
                  wrapper: "min-h-[400px]",
                }}
              >
                <TableHeader>
                  <TableColumn width="40">Check</TableColumn>
                  <TableColumn
                    width="40"
                    key="user_name"
                    onClick={() => sortTable("user_name")}
                    allowsSorting
                  >
                    Username
                  </TableColumn>

                  <TableColumn
                    width="40"
                    key="given_name"
                    allowsSorting
                    onClick={() => sortTable("given_name")}
                  >
                    Given Name
                  </TableColumn>

                  <TableColumn width="40" key="title"
                    onClick={() => sortTable("title")} allowsSorting>Title</TableColumn>

                  <TableColumn width="40" key = "institution" onClick={() => sortTable("institution")} allowsSorting>Institution</TableColumn>
                  <TableColumn width="40" key = "status" onClick={() => sortTable("status")} allowsSorting>Status/Role</TableColumn>
                  <TableColumn width="40" key = "pi" onClick={() => sortTable("pi")} allowsSorting>PI</TableColumn>
                  <TableColumn width="40" key = "email" onClick={() => sortTable("email")} allowsSorting>Email</TableColumn>
                  <TableColumn width="40" key = "alt_email" onClick={() => sortTable("alt_email")} allowsSorting>Alt. Email</TableColumn>
                  <TableColumn width="40" key = "registered_date" onClick={() => sortTable("registered_date")} allowsSorting>Registered Date</TableColumn>
                  <TableColumn width="40" key = "approved" onClick={() => sortTable("approved")} allowsSorting>Approved</TableColumn>
                </TableHeader>

                <TableBody>
                  {(() => {
                    if (isLoading) {
                      return (
                        <TableRow key="loading-row">
                          {Array(11).fill(0).map((_, index) => (
                            <TableCell key={`loading-cell-${index}`} className={index === 0 ? "text-center" : ""}>
                              {index === 0 ? "Loading users..." : ""}
                            </TableCell>
                          ))}
                        </TableRow>
                      );
                    }
                    
                    if (filteredAndSortedUsers.length === 0) {
                      return (
                        <TableRow key="empty-row">
                          {Array(11).fill(0).map((_, index) => (
                            <TableCell key={`empty-cell-${index}`} className={index === 0 ? "text-center" : ""}>
                              {index === 0 ? "No users found." : ""}
                            </TableCell>
                          ))}
                        </TableRow>
                      );
                    }
                    
                    return filteredAndSortedUsers.map(user => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Checkbox
                            isSelected={checkedUsers[user.id] || false}
                            onChange={() => handleCheckboxChange(user.id)}
                          />
                        </TableCell>
                        <TableCell>{user.user_name}</TableCell>
                        <TableCell>{user.given_name}</TableCell>
                        <TableCell>{user.title}</TableCell>
                        <TableCell>{user.institution}</TableCell>
                        <TableCell>{user.status}</TableCell>
                        <TableCell>{user.pi}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.alt_email}</TableCell>
                        <TableCell>{user.reg_date}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              user.approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {user.approved ? 'Approved' : 'Pending...'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ));
                  })()}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-center mt-4">
              <Pagination
                total={totalPages}
                initialPage={1}
                page={page}
                onChange={setPage}
              />
            </div>
          </div>
        </div>
      </div>
    </AuthChecker>
  );
}

export default UserManagement;