import React, { useEffect, useState } from 'react';
import "../../app/globals.css";
import NavBar from '@/components/NavBar';
import Link from 'next/link';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../../firebaseConfig';
import { useRouter } from 'next/router';
import { Card, CardHeader, CardBody, CardFooter } from "@nextui-org/card";
import {Input} from "@nextui-org/react";
import {Select, SelectSection, SelectItem} from "@nextui-org/select";
import {Button} from "@nextui-org/react";

const SignUpPage = () => {
  const [userType, setUserType] = useState("");
  const [username, setUsername] = useState('');
  const [givenName, setGivenName] = useState('');
  const [institution, setInstitution] = useState('');
  const [title, setTitle] = useState('');
  const [pi, setpi] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const [institutions, setInstitutions] = useState<any[]>([]);
  const [professors, setProfessors] = useState<any[]>([]);

  const router = useRouter();

  useEffect(() => {
    const fetchInstitutions = async () => {
      const response = await fetch('/api/getInstitutions');
      const data = await response.json();
      const sortedData = data.sort((a:any, b:any) => a.fullname.localeCompare(b.fullname));
      setInstitutions(sortedData);
    };

    const fetchProfessors = async () => {
      const response = await fetch('api/getAllProfessors');
      const data = await response.json();
      const sortedData = data.sort((a:any, b:any) => a.institution.localeCompare(b.institution));
      setProfessors(sortedData);
    }

    fetchInstitutions();
    fetchProfessors();
  }, [])

  const handleSignUp = async (email: string, password: string) => {
    const newUser = {
      user_name: username,
      given_name: givenName,
      title: title,
      pi: pi,
      institution,
      status: userType,
      email,
      password
    }
    fetch(`/api/createUser`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newUser),
    }).then((response) => {
      createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          console.log("Successfully created new user.")
          router.push('/')
        })
        // Might want to catch case where createUser succeeds but firebase fails
    }).catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
      });
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await handleSignUp(email, password);
  };

  if (userType === "") {
    return (
      <>
        <NavBar />
          <div style = {{ display: "flex", 
                flexDirection: "column", 
                alignItems: "center", 
                justifyContent: "center",     height: "100vh", 
                  width: "100vw"}}>
                  <div
                    style={{
                      position: "absolute", 
                      width: "100%", 
                      height: "100%", 
                      background: "linear-gradient(180deg, #FFFFFF 16.13%, #E3F3F5 58.36%)",
                      zIndex: -1, 
                    }}
                  ></div>
            <Card 
              style={{
                width: "448px", 
                height: "380px", 
                borderRadius: "14px", 
                padding: "32px", 
                gap: "24px", 
                display: "flex", 
                flexDirection: "column", 
                alignItems: "center", 
                justifyContent: "center"
              }}
            >
              <h1 
                className="text-2xl text-center" 
                style={{
                  fontSize: "30px", 
                  fontWeight: "400", 
                  lineHeight: "40px", 
                  marginBottom: "16px"
                }}
              >
                New User Registration
              </h1>
              <h2 
                style={{
                  fontSize: "16px", 
                  lineHeight: "24px", 
                  color: "#525252"
                }}
              >
                Register as...
              </h2>
              <Button 
                onClick={() => setUserType("professor")} 
                variant="bordered" 
                size="lg"
                className="text-blue-600 hover:text-blue-800" 
                style={{
                  textDecoration: "none", 
                  width: "384px", 
                  height: "48px",
                  color: "#06B7DB", 
                  borderColor: "#06B7DB"
                }}
              >
                A faculty member
              </Button>
              <Button 
                onClick={() => setUserType("student")} 
                variant="bordered" 
                className="text-blue-600 hover:text-blue-800" 
                size = "lg"
                style={{
                  textDecoration: "none", 
                  width: "384px", 
                  color: "#06B7DB", 
                  borderColor: "#06B7DB", 
                  marginBottom: "16px"
                }}
              >
                A student
              </Button>
              <Button 
                onClick={() => setUserType("neither")} 
                style={{
                  background: "none",
                  border: "none",
                  padding: "0",
                  color: "#06B7DB",
                  cursor: "pointer",
                  width: "384px",
                  textAlign: "center"
                }}
              >
                I am neither a student nor faculty
              </Button>
            </Card>
          </div>
        </>

    );
  } else if(userType === "neither"){
    return(
     <>
        <NavBar />
          <div style = {{ display: "flex", 
                flexDirection: "column", 
                alignItems: "center", 
                justifyContent: "center",     height: "100vh", 
                  width: "100vw"}}>
              <div
                    style={{
                      position: "absolute", 
                      width: "100%", 
                      height: "100%", 
                      background: "linear-gradient(180deg, #FFFFFF 16.13%, #E3F3F5 58.36%)",
                      zIndex: -1, 
                    }}
                  ></div>
            <Card 
              style={{
                width: "448px", 
                height: "524px", 
                borderRadius: "14px", 
                padding: "32px", 
                gap: "24px", 
                display: "flex", 
                flexDirection: "column", 
                alignItems: "center", 
                justifyContent: "center"
              }}
            >
              <h1 
                style={{
                  fontSize: "30px", 
                  fontWeight: "400", 
                  lineHeight: "40px", 
                  marginBottom: "16px"
                }}
              >
                New User Registration
              </h1>
                <p style = {{width: "384px", gap: "24px", height: "144px", fontSize: "16px", color: "#525252"}}>
                  User accounts for this website are intended for individuals affiliated with undergraduate laboratories from institutions that have been selected to participate in the CURE network. 
                  The majority of such users will be either the faculty primary investigator (PI) or the PI's students. 
                </p>

                <p style={{color: "#525252"}}>If you do not fall into one of these two categories yet still feel that you need access to the secure pages of this website for such things as data submission, <a href="mailto:webmaster@d2dcure.com" style={{color: "#06B7DB"}}>please email the webmaster to request access.</a> </p>
              <div style={{display: "flex", flexDirection: "column", gap: "0px"}}>
                <Link href="/login" style={{color: "#06B7DB", margin: "0", padding: "0"}}>Already a member of the D2D Cure Network?</Link>
                <Link href="/login" style={{color:"#06B7DB",margin: "0", padding: "0",                 display: "flex", 
                flexDirection: "column", 
                alignItems: "center", 
                justifyContent: "center"}}>Click here to login.</Link>
              </div>
              </Card>
          </div>
        </>
    );
  }
  
  else if (userType === "professor") {
    return (
      <>
        <NavBar />
        <div className="flex flex-col justify-center items-center min-h-screen">
        <div
                    style={{
                      position: "absolute", 
                      top: "300px",
                      width: "100%", 
                      height: "100%", 
                      background: "linear-gradient(180deg, #FFFFFF 16.13%, #E3F3F5 58.36%)",
                      zIndex: -1, 
                    }}
                  ></div>
          <div className="w-full max-w-lg p-4">
            
            <Card
              style={{
                width: "100%",
                borderRadius: "14px",
                padding: "32px",
                gap: "36px",
                display: "flex", // Make the Card a flex container
                justifyContent: "center", // Center content horizontally
                alignItems: "center", // Center content vertically
                boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)", // Add subtle shadow for better visual
                marginTop: "72px"
              }}
            >
              <form onSubmit={handleSubmit} style={{ gap: "36px", width: "100%" }}>
                <p className="block text-gray-700 text-sm mb-2">All fields required.</p>

                <div className="mb-4">
                  <label className="block text-gray-700 text-sm mb-2" htmlFor="username">
                    Username
                  </label>
                  <Input
                    id="username"
                    type="username"
                    placeholder="Enter your new username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    variant="bordered"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm mb-2" htmlFor="pi">
                    Institution
                  </label>
                  <Select
                    placeholder="Select your institution"
                    variant = "bordered"
                    selectedKeys={new Set([institution])}
                    onSelectionChange={(value) => setInstitution(Array.from(value).join(''))}
                  >
                    {institutions.map((institution) => (
                      <SelectItem key={institution.abbr} textValue={institution.fullname}>
                        {institution.fullname}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm mb-2" htmlFor="given_name">
                    Given Name
                  </label>
                  <Input
                    id="given_name"
                    type="text"
                    placeholder="Enter your given name"
                    value={givenName}
                    onChange={(e) => setGivenName(e.target.value)}
                    variant="bordered"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm mb-2" htmlFor="title">
                    Title
                  </label>
                  <Input
                    id="title"
                    type="text"
                    placeholder="Enter your title"
                    value={title}
                    variant="bordered"
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm mb-2" htmlFor="email">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    variant="bordered"
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm mb-2" htmlFor="password">
                    Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your new password"
                    value={password}
                    variant="bordered"
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="flex items-center justify-between">
                  <button
                    className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    type="submit"
                    style={{
                      fontSize: "16px",
                      background: "#06B7DB",
                      width: "100%",
                      height: "48px",
                      borderRadius: "12px",
                      borderColor: "#E4E4E7",
                      border: "2px solid",
                      paddingRight: "16px",
                      paddingLeft: "16px",
                      gap: "12px",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      marginTop: "36px",
                    }}
                  >
                    Sign Up
                  </button>
                </div>
                {error && <p className="text-red-500 text-xs italic">{error}</p>}
              </form>
            </Card>
          </div>
        </div>
      </>

);
  } else if (userType === "student") {
    return (
        <>
          <NavBar />
          <div className="flex flex-col justify-center items-center min-h-screen">
              <div
                    style={{
                      position: "absolute", 
                      top: "300px",
                      width: "100%", 
                      height: "100%", 
                      background: "linear-gradient(180deg, #FFFFFF 16.13%, #E3F3F5 58.36%)",
                      zIndex: -1, 
                    }}
                  ></div>
            <div className="w-full max-w-lg p-4">
            <Card
                style={{
                  width: "100%",
                  borderRadius: "14px",
                  padding: "32px",
                  gap: "36px",
                  display: "flex", // Make the Card a flex container
                  justifyContent: "center", // Center content horizontally
                  alignItems: "center", // Center content vertically
                  boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)", // Add subtle shadow for better visual
                  marginTop: "72px"
                }}
              >
              <form
                onSubmit={handleSubmit} style = {{width: "100%"}}
              >
                <p className="block text-gray-700 text-sm mb-2">All fields required.</p>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm mb-2" htmlFor="username">
                    Username
                  </label>
                  <Input
                    id="username"
                    type="username"
                    placeholder="Enter your new username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    variant = "bordered"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 text-sm mb-2" htmlFor="given_name">
                    Given Name
                  </label>
                  <Input
                    id="given_name"
                    type="text"
                    placeholder="Enter your given name"
                    value={givenName}
                    variant = "bordered"
                    onChange={(e) => setGivenName(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 text-sm mb-2" htmlFor="pi">
                    Primary Investigator (your professor)
                  </label>
                      <Select
                        variant = "bordered"
                        placeholder="Select your PI"
                        selectedKeys={new Set([pi])}
                        onSelectionChange={(value) => {
                          const selectedPI = Array.from(value).join('');
                          setpi(selectedPI);
                          setInstitution(
                            professors.find((professor) => professor.given_name === selectedPI)?.institution || ''
                          );
                        }}
                      >
                        {professors.map((professor) => (
                          <SelectItem key={professor.given_name} textValue={professor.given_name}>
                            {professor.given_name} ({professor.institution})
                          </SelectItem>
                        ))}
                      </Select>
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 text-sm mb-2" htmlFor="email">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    variant = "bordered"
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 text-sm mb-2" htmlFor="password">
                    Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your new password"
                    value={password}
                    variant = "bordered"
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="flex items-center justify-between">
                    <button
                      className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                      type="submit"
                      style={{
                        fontSize: "16px",
                        background: "#06B7DB",
                        width: "100%",
                        height: "48px",
                        borderRadius: "12px",
                        borderColor: "#E4E4E7",
                        border: "2px solid",
                        paddingRight: "16px",
                        paddingLeft: "16px",
                        gap: "12px",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        marginTop: "36px",
                      }}
                    >
                      Sign Up
                    </button>
                  </div>

                {error && <p className="text-red-500 text-xs italic">{error}</p>}
              </form>
              </Card>
            </div>
          </div>
        </>

    );
  }
}

export default SignUpPage;