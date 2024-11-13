import React, { useState, useEffect, useCallback } from 'react';
import "../../app/globals.css";
import { useUser } from '@/components/UserProvider';
import { AuthChecker } from '@/components/AuthChecker';
import NavBar from '@/components/NavBar';
import { Breadcrumbs, BreadcrumbItem, Button, Chip, Spinner, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@nextui-org/react";
import { Key, SortDescriptor } from '@react-types/shared';
import Link from 'next/link';

const CuratePage = () => {
    const { user, loading } = useUser();

    const [data, setData] = useState<any[]>([]);
    const [viewableData, setViewableData] = useState<any[]>([]);
    // const [sortColumn, setSortColumn] = useState<string>('ID');
    // const [sortDirection, setSortDirection] = useState<string>('asc');
    const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
        column: "ID",
        direction: "ascending"
    });
    type Selection = "all" | Set<Key>;
    // const [checkedItems, setCheckedItems] = useState<Selection>(new Set<Key>([]));
    const [viewAs, setViewAs] = useState<string>("")
    const [isLoading, setIsLoading] = useState(true);
    // const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;

            setViewAs(user.status);
            const response = await fetch('/api/getPendingData');
            const data = await response.json();
            setData(data)
            filterAndSortData(data);
        };
        fetchData();
        setIsLoading(false);
    }, [user])

    useEffect(() => {
        if (!user) return;

        console.log("yooo");
        setIsLoading(true);
        filterAndSortData(data);
        console.log(data)
        setIsLoading(false);
    }, [viewAs])

    const columns = [
        { name: "STATUS", uid: "status", sortable: false},
        { name: "ID", uid: "id", sortable: true },
        { name: "Variant", uid: "variant", sortable: true },
        { name: "Creator", uid: "creator", sortable: true },
        { name: "Assay Date", uid: "assay_date", sortable: false},
        { name: "Km", uid: "km", sortable: false },
        { name: "Kcat", uid: "kcat", sortable: false },
        { name: "T50", uid: "t50", sortable: false },
        { name: "Comments", uid: "comments", sortable: false },
        { name: "ACTIONS", uid: "actions", sortable: false }
      ];

    const renderCell = useCallback((data:any, columnKey:Key) => {
        switch (columnKey) {
            case "status":
                {/* TODO: Hard coded rn!! */}
                return (
                    <Chip className="bg-[#E6F1FE] text-[#06B7DB]" variant="flat">
                        In Progress
                    </Chip>
                );
            case "id":
                return data.id
            case "variant":
                return getVariantDisplay(data.resid, data.resnum, data.resmut)
            case "creator":
                return data.creator
            case "assay_date":
                return "hi"
            case "km":
                return data.KM_avg !== null && !isNaN(data.KM_avg) ? `${roundTo(data.KM_avg, 2)} ± ${data.KM_SD !== null && !isNaN(data.KM_SD) ? roundTo(data.KM_SD, 2) : '—'}` : '—'
            case "kcat":
                data.kcat_avg !== null && !isNaN(data.kcat_avg) ? `${roundTo(data.kcat_avg, 1)} ± ${data.kcat_SD !== null && !isNaN(data.kcat_SD) ? roundTo(data.kcat_SD, 1) : '—'}` : '—'
            case "t50":
                data.T50 !== null && !isNaN(data.T50) ? `${roundTo(data.T50, 1)} ± ${data.T50_SD !== null && !isNaN(data.T50_SD) ? roundTo(data.T50_SD, 1) : '—'}` : '—'
            case "comments":
                return data.comments
            case "actions":
                return (
                    <Link href={`/submit/single_variant/${encodeURIComponent(data.id)}`} passHref>
                        <Button variant="light" color="primary">
                            View
                        </Button>
                    </Link>
                )
        }
    }, []);

    const filterAndSortData = (data:any) => {
        let filteredData = data;
        if (user.status === "professor" || viewAs === "professor") {
            filteredData = data
                .filter((item:any) => item.institution === user.institution)
                .filter((item:any) => item.approved_by_pi === false);
        }
        console.log("b4", viewableData, filteredData, sortDescriptor);
        const sortedData = sortData(filteredData, sortDescriptor)
        console.log("after", sortedData);
        setViewableData(sortedData);
        // const initialCheckedItems = data.reduce((state:any, item:any) => ({
        //     ...state,
        //     [item.id]: false  // Initialize all checkboxes as unchecked
        // }), {} as Record<number, boolean>);
        // setCheckedItems(initialCheckedItems);
    }

    const handleColumnClick = (sortDescriptor: SortDescriptor) => {
        // const sortColumn = sortDescriptor.column;
        // const sortDirection = sortDescriptor.direction;
        // if (sortColumn === columnName) {
        //     newSortDirection = sortDirection === 'asc' ? 'desc' : 'asc'
        //     setSortDirection(newSortDirection);
        // } else {
        //     newSortDirection = 'asc'
        //     setSortColumn(columnName);
        //     setSortDirection('asc');
        // }
        // console.log("sort", sortDescriptor)
        setSortDescriptor(sortDescriptor)
        // console.log("Before:", viewableData)
        // console.log("sort", sortDescriptor)
        const sortedData = sortData(viewableData, sortDescriptor)
        // console.log("After:", viewableData)

        setViewableData(sortedData);
    };

    function sortData(data: any, sortDescriptor: SortDescriptor) {
        const sortColumn = sortDescriptor.column;
        const sortDirection = sortDescriptor.direction;

        const sortedData = data.sort((a: any, b: any) => {
            // If user is admin, sort to show data approved by pi first
            let valA, valB;
            let compareVal;

            if (viewAs === "ADMIN") {
                valA = a.approved_by_pi;
                valB = b.approved_by_pi;
                if (valA && !valB) {        // A is approved, B is not, A comes first
                    return -1;
                } else if (valB && !valA) { // B is approved, A is not, B comes first
                    return 1;
                } // Otherwise continue with rest of sorting
            }

            if (sortColumn === 'id') {
                valA = a.id;
                valB = b.id;
                compareVal = valA - valB;
            } else if (sortColumn === 'variant') {
                valA = a.resnum;
                valB = b.resnum;
                compareVal = valA - valB;
                if (compareVal === 0) {
                    compareVal = a.resmut.localeCompare(b.resmut);
                }
            } else if (sortColumn === 'creator') {
                valA = a.creator;
                valB = b.creator;
                compareVal = valA.localeCompare(valB);
            }

            if (compareVal !== 0) {
                if (sortDirection === 'ascending') {
                    return compareVal;
                } else {
                    return -compareVal;
                }
            }

            // Always sort by ID ascending secondarily
            compareVal = a.id - b.id;
            return compareVal;

        })

        return sortedData
    }

    const getVariantDisplay = (resid: any, resnum: any, resmut: any) => {
        if (resnum === 0) {
          return 'WT';
        }
        return `${resid}${resnum}${resmut}`;
    };

    // const handleCheckboxChange = (id: number) => {
    //     setCheckedItems(prevState => ({
    //         ...prevState,
    //         [id]: !prevState[id]
    //     }));
    // };

    const roundTo = (number:number, decPlaces:number) => {
        if (number === null) {
          return null;
        }
        const factor = Math.pow(10, decPlaces);
        return (Math.round(number * factor) / factor).toFixed(decPlaces);
    };

    const getSelectedIds = () => {
        return Object.entries(checkedItems)
                .filter(([key, value]) => value === true)
                .map(([key, value]) => parseInt(key, 10));
    }

    const approveData = () => {
        const selectedIds = getSelectedIds();
        console.log(selectedIds);
        fetch(`/api/curateData`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ids: selectedIds, status: viewAs }),
        }).then((response) => {
            if (!response.ok) {  // Checks if response status code is not in the 200-299 range
                throw new Error('Failed to approve data, server responded with ' + response.status);
            }
            // Make approved data invisible
            setViewableData((originalData) => originalData.filter((item) => !selectedIds.includes(item.id) ));
            if (user.status === "ADMIN") {
                if (viewAs === "ADMIN") {
                    // Remove data from page, since it has been fully curated
                    setData((originalData) => originalData.filter((item) => !selectedIds.includes(item.id) ));
                } else {
                    // Just keep data invisible, but update for when viewAs changed to "ADMIN"
                    data.map((item) => {
                        if (selectedIds.includes(item.id)) {
                            item.approved_by_pi = true;
                        }
                        return item;
                    })
                }
            } else {
                // Remove data from page
                setData((originalData) => originalData.filter((item) => !selectedIds.includes(item.id) ));
            }

            removeIdsFromCheckedItems(selectedIds);
            console.log("Successfully approved data.");
        }).catch((error) => {
            console.log(error);
        })
    }

    const rejectData = () => {
        const selectedIds = getSelectedIds();
        console.log(selectedIds);
        fetch(`/api/curateData`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ids: selectedIds, status: viewAs }),
        }).then((response) => {
            if (!response.ok) {  // Checks if response status code is not in the 200-299 range
                throw new Error('Failed to reject data, server responded with ' + response.status);
            }
            // Remove data from table and page
            setViewableData((originalData) => originalData.filter((item) => !selectedIds.includes(item.id) ));
            setData((originalData) => originalData.filter((item) => !selectedIds.includes(item.id) ));
            removeIdsFromCheckedItems(selectedIds);
            console.log("Successfully rejected data.");
        }).catch((error) => {
            console.log(error);
        })
    }

    const removeIdsFromCheckedItems = (idsToRemove: number[]) => {
        setCheckedItems(currentItems => {
            const updatedItems = { ...currentItems };
            idsToRemove.forEach(id => {
                delete updatedItems[id]; // Remove each id from the record
            });
            return updatedItems;
        });
    };

    return (
        <div>
            <NavBar/>
            <AuthChecker minimumStatus={"professor"}>
                <div className="m-24 bg-white">
                    <div className="col-span-1 items-center">
                        <Breadcrumbs
                            itemClasses={{
                            item: "text-black data-[current=true]:text-gray-300", // White text for breadcrumb items, lighter for current item
                            separator: "text-black/40", // Lighter white for separators
                            }}
                        >
                            <BreadcrumbItem href="/">Home</BreadcrumbItem>
                            <BreadcrumbItem>Database</BreadcrumbItem>
                            <BreadcrumbItem>Bulk Curation of Data</BreadcrumbItem>
                        </Breadcrumbs>
                        <div className="pt-8">
                            <h1 className="mb-4 text-4xl font-inter md:text-3xl xl:text-4xl dark:text-white">Bulk Curation of Data</h1>
                            { viewAs === "professor" &&
                                <h2 className="text-xl">Data from the {user?.user_name} Lab or other labs at {user?.institution}</h2>
                            }
                            { viewAs === "ADMIN" &&
                                <h2 className="text-xl">Data from the D2D Network</h2>
                            }
                            <p className='text'>Please approve or reject the data below.</p>
                            {/* <p>{viewableData.length} records of data remain to be curated. Please approve or reject the data below.</p> */}

                            { (user?.status === "ADMIN") &&
                                <div className="flex">
                                    <p>You are curating as a {viewAs === "ADMIN" ? "D2D Network Administrator." : "professor."} </p>
                                    <p
                                        className='ml-1 underline text-blue-500 cursor-pointer'
                                        onClick={() => setViewAs((currentView) => currentView === "ADMIN" ? "professor" : "ADMIN")}
                                    >
                                        Click here to curate data as {viewAs === "ADMIN" ? "the instructor of a laboratory." : "a D2D Network Administrator"}
                                    </p>
                                </div>
                            }

                            {/* <div className="flex flex-row items-center my-2">
                                <button
                                    className={`${!Object.values(checkedItems).some(value => value === true) ? "bg-gray-500" : "bg-green-500"} mx-2 p-2 rounded`}
                                    onClick={approveData}
                                    disabled={!Object.values(checkedItems).some(value => value === true)}
                                >
                                    Approve
                                </button>
                                <button
                                    className={`${!Object.values(checkedItems).some(value => value === true) ? "bg-gray-500" : "bg-red-500"} mx-2 p-2 rounded`}
                                    onClick={rejectData}
                                    disabled={!Object.values(checkedItems).some(value => value === true)}
                                >
                                    Reject
                                </button>
                            </div> */}
                        </div>

                        <Table
                            aria-label="Data to Curate"
                            isHeaderSticky
                            selectionMode="multiple"
                            // selectedKeys={checkedItems}
                            // onSelectionChange={setCheckedItems}
                            sortDescriptor={sortDescriptor}
                            onSortChange={handleColumnClick}
                            className="mb-8 sm:mb-12"
                        >
                            <TableHeader columns={columns}>
                                {(column) => (
                                    <TableColumn
                                        key={column.uid}
                                        allowsSorting={column.sortable}
                                    >
                                        {column.name}
                                    </TableColumn>
                                )}
                                {/* <TableColumn>{""}</TableColumn> */}
                                {/* <TableColumn>STATUS</TableColumn>
                                <TableColumn allowsSorting>ID</TableColumn>
                                <TableColumn allowsSorting>Variant</TableColumn>
                                <TableColumn allowsSorting>Creator</TableColumn>
                                {/* <TableColumn>Uploaded By</TableColumn> */}
                                {/* <TableColumn>Assay Date</TableColumn>
                                <TableColumn>Km</TableColumn>
                                <TableColumn>Kcat</TableColumn>
                                <TableColumn>T50</TableColumn>
                                <TableColumn>Comments</TableColumn>
                                <TableColumn>ACTIONS</TableColumn> */}
                            </TableHeader>
                            <TableBody
                                items={viewableData}
                                isLoading={isLoading}
                                loadingContent={<Spinner label="Loading..." />}
                            >
                                {(item) => (
                                    <TableRow key={item.id}>
                                        {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                                    </TableRow>
                                )}
                            </TableBody>
                                {/* {viewableData.map((data) => (
                                    <TableRow key={data.id}>
                                        {/* <TableCell>
                                            hi
                                        </TableCell>
                                        <TableCell>
                                            {/* TODO: Hard coded rn!!
                                            <Chip className="bg-[#E6F1FE] text-[#06B7DB]" variant="flat">
                                                In Progress
                                            </Chip>
                                        </TableCell>
                                        <TableCell>
                                            {data.id}
                                        </TableCell>
                                        <TableCell>
                                            {getVariantDisplay(data.resid, data.resnum, data.resmut)}
                                        </TableCell>
                                        <TableCell>
                                            {data.creator}
                                        </TableCell>
                                        {/* <TableCell>
                                            hi
                                        </TableCell>
                                        <TableCell>
                                            hi
                                        </TableCell>
                                        <TableCell>
                                            {data.KM_avg !== null && !isNaN(data.KM_avg) ? `${roundTo(data.KM_avg, 2)} ± ${data.KM_SD !== null && !isNaN(data.KM_SD) ? roundTo(data.KM_SD, 2) : '—'}` : '—'}
                                        </TableCell>
                                        <TableCell>
                                            {data.kcat_avg !== null && !isNaN(data.kcat_avg) ? `${roundTo(data.kcat_avg, 1)} ± ${data.kcat_SD !== null && !isNaN(data.kcat_SD) ? roundTo(data.kcat_SD, 1) : '—'}` : '—'}
                                        </TableCell>
                                        <TableCell>
                                            {data.T50 !== null && !isNaN(data.T50) ? `${roundTo(data.T50, 1)} ± ${data.T50_SD !== null && !isNaN(data.T50_SD) ? roundTo(data.T50_SD, 1) : '—'}` : '—'}
                                        </TableCell>
                                        <TableCell>
                                            {data.comments}
                                        </TableCell>
                                        <TableCell>
                                            <Link href={`/submit/single_variant/${encodeURIComponent(data.id)}`} passHref>
                                                <Button variant="light" color="primary">
                                                    View
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody> */}
                        </Table>

                        {/* <table className="table-auto min-w-full border-collapse border border-gray-400">
                            <thead className="bg-gray-100 sticky top-0 z-10">
                                <tr>
                                    <th className="border border-gray-300"/>
                                    <th className={`border border-gray-300 cursor-pointer ${sortColumn === "ID" ? "text-orange-500" : "text-blue-500"}`}
                                        onClick={() => handleColumnClick("ID")}>ID {sortColumn === "ID" ? (sortDirection === "asc" ? "▲" : "▼") : ""}</th>
                                    <th className={`border border-gray-300 cursor-pointer ${sortColumn === "Variant" ? "text-orange-500" : "text-blue-500"}`}
                                        onClick={() => handleColumnClick("Variant")}>Variant {sortColumn === "Variant" ? (sortDirection === "asc" ? "▲" : "▼") : ""}</th>
                                    <th className={`border border-gray-300 cursor-pointer ${sortColumn === "Creator" ? "text-orange-500" : "text-blue-500"}`}
                                        onClick={() => handleColumnClick("Creator")}>Creator {sortColumn === "Creator" ? (sortDirection === "asc" ? "▲" : "▼") : ""}</th>
                                    <th className="border border-gray-300">Km</th>
                                    <th className="border border-gray-300">Kcat</th>
                                    <th className="border border-gray-300">T50</th>
                                    <th>Dataset</th>
                                </tr>
                            </thead>
                            <tbody>
                                {viewableData.map((data, index) => (
                                    <>
                                        <tr>
                                            <td className={`border border-gray-300 ${data.approved_by_pi ? 'bg-green-400' : ''}`}>
                                                <input
                                                    type="checkbox"
                                                    checked={checkedItems[data.id] || false}
                                                    onChange={() => handleCheckboxChange(data.id)}
                                                />

                                            </td>
                                            <td className="border border-gray-300">
                                                {data.id}
                                            </td>
                                            <td className="border border-gray-300">
                                                {getVariantDisplay(data.resid, data.resnum, data.resmut)}
                                            </td>
                                            <td className="border border-gray-300">
                                                {data.creator}
                                            </td>
                                            <td className="border border-gray-300">
                                                {data.KM_avg !== null && !isNaN(data.KM_avg) ? `${roundTo(data.KM_avg, 2)} ± ${data.KM_SD !== null && !isNaN(data.KM_SD) ? roundTo(data.KM_SD, 2) : '—'}` : '—'}
                                            </td>
                                            <td className="border border-gray-300">
                                                {data.kcat_avg !== null && !isNaN(data.kcat_avg) ? `${roundTo(data.kcat_avg, 1)} ± ${data.kcat_SD !== null && !isNaN(data.kcat_SD) ? roundTo(data.kcat_SD, 1) : '—'}` : '—'}
                                            </td>
                                            <td className="border border-gray-300">
                                                {data.T50 !== null && !isNaN(data.T50) ? `${roundTo(data.T50, 1)} ± ${data.T50_SD !== null && !isNaN(data.T50_SD) ? roundTo(data.T50_SD, 1) : '—'}` : '—'}
                                            </td>
                                            <td className="border border-gray-300">
                                                <Link
                                                    className="underline text-blue-500 cursor-pointer"
                                                    href={`/submit/single_variant/${encodeURIComponent(data.id)}`}
                                                >
                                                    View Dataset
                                                </Link>
                                            </td>
                                        </tr>
                                        {data.kineticRawData && (
                                            <tr>
                                                <td />
                                                <td>Kin. Data: </td>
                                                <td>Plate ID: {data.kineticRawData.plate_num ?? "N/A"}</td>
                                                <td colSpan={2}>Uploaded by: {data.kineticRawData.user_name ?? "N/A"}</td>
                                                <td>Purif. Date: {data.kineticRawData.purification_date ?? "N/A"}</td>
                                                <td>Assay Date: {data.kineticRawData.assay_date ?? "N/A"}</td>
                                            </tr>
                                        )}
                                        {data.tempRawData && (
                                            <tr>
                                                <td />
                                                <td>Temp. Data: </td>
                                                <td>Plate ID: {data.tempRawData.plate_num ?? "N/A"}</td>
                                                <td colSpan={2}>Uploaded by: {data.tempRawData.user_name ?? "N/A"}</td>
                                                <td>Purif. Date: {data.tempRawData.purification_date ?? "N/A"}</td>
                                                <td>Assay Date: {data.tempRawData.assay_date ?? "N/A"}</td>
                                            </tr>
                                        )}
                                    </>

                                ))}
                            </tbody>
                        </table> */}
                    </div>
                </div>
            </AuthChecker>
        </div>


    )
}

export default CuratePage;