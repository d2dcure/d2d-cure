import React, { useState, useEffect } from 'react';
import "../../app/globals.css";
import { useUser } from '@/components/UserProvider';
import NavBar from '@/components/NavBar';
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell
} from "@nextui-org/table";
import { Button, Input, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@nextui-org/react";
import { ArrowDownIcon, ArrowUpIcon, SearchIcon } from 'lucide-react';
import { Breadcrumbs, BreadcrumbItem } from "@nextui-org/breadcrumbs";
import { AuthChecker } from '@/components/AuthChecker';

interface Institution {
  id: number;
  fullname: string;
  abbr: string;
  state?: string;
  country_code: string;
  url?: string;
}

function InstitutionManagement() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const { user, loading } = useUser();
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: string }>({ key: '', direction: '' });
  const [isScrolling, setIsScrolling] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(true);
  const [scrollDirection, setScrollDirection] = useState<'top' | 'bottom' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Modal state for creating institution
  const {isOpen, onOpen, onClose} = useDisclosure();
  const [newInstitution, setNewInstitution] = useState({
    fullname: '',
    abbr: '',
    state: '',
    country_code: 'USA',
    url: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInstitutions = async () => {
      setError(null);
      setIsLoading(true);
      
      try {
        const response = await fetch('/api/getInstitutions');
        if (!response.ok) {
          throw new Error(`Failed to fetch institutions: ${response.statusText}`);
        }
        const data = await response.json();
        setInstitutions(data);
        
      } catch (err) {
        console.error('Error fetching institutions:', err);
        setError('Failed to load institutions. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInstitutions();
  }, []);

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
      const tableElement = document.getElementById('institution-management-table');
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

  // Sorting function
  const sortTable = (key: string) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleCreateInstitution = async () => {
    setIsCreating(true);
    setCreateError(null);
    
    try {
      const response = await fetch('/api/createInstitution', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newInstitution),
      });

      if (!response.ok) {
        throw new Error(`Failed to create institution: ${response.statusText}`);
      }

      const createdInstitution = await response.json();
      
      // Add the new institution to the list
      setInstitutions(prev => [...prev, createdInstitution]);
      
      // Reset form and close modal
      setNewInstitution({
        fullname: '',
        abbr: '',
        state: '',
        country_code: 'USA',
        url: ''
      });
      onClose();
      
      console.log('Institution created successfully:', createdInstitution);
    } catch (error) {
      console.error('Error creating institution:', error);
      setCreateError(error instanceof Error ? error.message : 'Failed to create institution');
    } finally {
      setIsCreating(false);
    }
  };

  const filteredAndSortedInstitutions = [...institutions]
    .filter((institution) =>
      institution.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      institution.abbr?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortConfig.key) {
        const valueA = a[sortConfig.key as keyof Institution];
        const valueB = b[sortConfig.key as keyof Institution];

        // Handle null or undefined values
        if ((valueA == null && valueB == null) || (valueA == "" && valueB == "")) return 0;
        if (valueA == null || valueA == "") return sortConfig.direction === 'asc' ? 1 : -1;
        if (valueB == null || valueB == "") return sortConfig.direction === 'asc' ? -1 : 1;

        const valueAStr = valueA.toString().toLowerCase();
        const valueBStr = valueB.toString().toLowerCase();

        // Check if values are numerical
        const isNumeric = !isNaN(Number(valueA)) && !isNaN(Number(valueB));
        if (isNumeric) {
          return sortConfig.direction === 'asc'
            ? Number(valueA) - Number(valueB)
            : Number(valueB) - Number(valueA);
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

  // Show all institutions without pagination
  const displayedInstitutions = filteredAndSortedInstitutions;

  return (
    <AuthChecker minimumStatus="ADMIN">
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
            <BreadcrumbItem>Institution Management</BreadcrumbItem>
          </Breadcrumbs>

          <div className="pt-3">
            <h1 className="mb-4 text-4xl md:text-4xl lg:text-4xl font-inter dark:text-white">
              Institution Management
            </h1>
            <p className="text-gray-500 mb-8">
              Manage all institutions in the D2D network
            </p>

            <div className="flex justify-between items-center gap-4 mb-4">
              <Input
                isClearable
                classNames={{
                  base: "w-full sm:w-[200px] md:w-[300px]",
                }}
                placeholder="Search institutions..."
                size="sm"
                value={searchTerm}
                onClear={() => setSearchTerm("")}
                onValueChange={(value) => setSearchTerm(value)}
                startContent={
                  <SearchIcon className="w-4 h-4 text-gray-500" />
                }
              />
              <Button
                className="bg-[#06B7DB] text-white rounded-lg text-sm"
                onClick={() => {
                  setCreateError(null);
                  onOpen();
                }}
              >
                Create Institution
              </Button>
            </div>

            <div id="institution-management-table">
              <Table
                aria-label="Institutions Table"
                classNames={{
                  wrapper: "min-h-[400px]",
                }}
              >
                <TableHeader>
                  <TableColumn
                    width="200"
                    key="fullname"
                    onClick={() => sortTable("fullname")}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-1">
                      Institution Name
                      {sortConfig.key === "fullname" && (
                        sortConfig.direction === "asc" ? <ArrowUpIcon className="w-3 h-3" /> : <ArrowDownIcon className="w-3 h-3" />
                      )}
                    </div>
                  </TableColumn>
                  <TableColumn
                    width="100"
                    key="abbr"
                    onClick={() => sortTable("abbr")}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-1">
                      Abbreviation
                      {sortConfig.key === "abbr" && (
                        sortConfig.direction === "asc" ? <ArrowUpIcon className="w-3 h-3" /> : <ArrowDownIcon className="w-3 h-3" />
                      )}
                    </div>
                  </TableColumn>
                  <TableColumn 
                    width="80" 
                    key="state"
                    onClick={() => sortTable("state")} 
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-1">
                      State
                      {sortConfig.key === "state" && (
                        sortConfig.direction === "asc" ? <ArrowUpIcon className="w-3 h-3" /> : <ArrowDownIcon className="w-3 h-3" />
                      )}
                    </div>
                  </TableColumn>
                  <TableColumn 
                    width="120" 
                    key="country_code" 
                    onClick={() => sortTable("country_code")} 
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-1">
                      Country
                      {sortConfig.key === "country_code" && (
                        sortConfig.direction === "asc" ? <ArrowUpIcon className="w-3 h-3" /> : <ArrowDownIcon className="w-3 h-3" />
                      )}
                    </div>
                  </TableColumn>
                  <TableColumn 
                    width="200" 
                    key="url" 
                    onClick={() => sortTable("url")} 
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-1">
                      Website
                      {sortConfig.key === "url" && (
                        sortConfig.direction === "asc" ? <ArrowUpIcon className="w-3 h-3" /> : <ArrowDownIcon className="w-3 h-3" />
                      )}
                    </div>
                  </TableColumn>
                </TableHeader>

                <TableBody>
                  {(() => {
                    if (isLoading) {
                      return (
                        <TableRow key="loading-row">
                          {Array(5).fill(0).map((_, index) => (
                            <TableCell key={`loading-cell-${index}`} className={index === 0 ? "text-center" : ""}>
                              {index === 0 ? "Loading institutions..." : ""}
                            </TableCell>
                          ))}
                        </TableRow>
                      );
                    }
                    
                    if (displayedInstitutions.length === 0) {
                      return (
                        <TableRow key="empty-row">
                          {Array(5).fill(0).map((_, index) => (
                            <TableCell key={`empty-cell-${index}`} className={index === 0 ? "text-center" : ""}>
                              {index === 0 ? "No institutions found." : ""}
                            </TableCell>
                          ))}
                        </TableRow>
                      );
                    }
                    
                    return displayedInstitutions.map(institution => (
                      <TableRow key={institution.id}>
                        <TableCell>{institution.fullname}</TableCell>
                        <TableCell>{institution.abbr}</TableCell>
                        <TableCell>{institution.state || '-'}</TableCell>
                        <TableCell>{institution.country_code}</TableCell>
                        <TableCell>
                          {institution.url ? (
                            <a 
                              href={institution.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline"
                            >
                              {institution.url}
                            </a>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                      </TableRow>
                    ));
                  })()}
                </TableBody>
              </Table>
            </div>


          </div>
        </div>
      </div>

      {/* Create Institution Modal */}
      <Modal 
        isOpen={isOpen} 
        onClose={onClose}
        placement="top-center"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">Create New Institution</ModalHeader>
          <ModalBody>
            <Input
              label="Institution Name"
              placeholder="Enter full institution name"
              value={newInstitution.fullname}
              onChange={(e) => setNewInstitution({...newInstitution, fullname: e.target.value})}
              isRequired
            />
            <Input
              label="Abbreviation"
              placeholder="Enter abbreviation"
              value={newInstitution.abbr}
              onChange={(e) => setNewInstitution({...newInstitution, abbr: e.target.value})}
              isRequired
            />
            <Input
              label="State"
              placeholder="Enter state (optional)"
              value={newInstitution.state}
              onChange={(e) => setNewInstitution({...newInstitution, state: e.target.value})}
            />
            <Input
              label="Country Code"
              placeholder="Enter country code"
              value={newInstitution.country_code}
              onChange={(e) => setNewInstitution({...newInstitution, country_code: e.target.value})}
              isRequired
            />
            <Input
              label="Website URL"
              placeholder="Enter website URL (optional)"
              value={newInstitution.url}
              onChange={(e) => setNewInstitution({...newInstitution, url: e.target.value})}
            />
            {createError && (
              <div className="text-red-500 text-sm mt-2">
                {createError}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button 
              color="danger" 
              variant="light" 
              onClick={onClose}
              isDisabled={isCreating}
            >
              Cancel
            </Button>
            <Button 
              className="bg-[#06B7DB] text-white" 
              onClick={handleCreateInstitution}
              isDisabled={!newInstitution.fullname || !newInstitution.abbr || isCreating}
              isLoading={isCreating}
            >
              {isCreating ? "Creating..." : "Create Institution"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </AuthChecker>
  );
}

export default InstitutionManagement;
