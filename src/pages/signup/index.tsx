import React, { useEffect, useState } from 'react';
import "../../app/globals.css";
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
  const [institutionAbbr, setInstitutionAbbr] = useState('');
  const [title, setTitle] = useState('');
  const [pi, setpi] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [givenNameError, setGivenNameError] = useState('');
  const [institutionError, setInstitutionError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [professors, setProfessors] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const fetchInstitutions = async () => {
      const response = await fetch('/api/getInstitutions');
      const data = await response.json();
      const sortedData = data.sort((a:any, b:any) => a.fullname.localeCompare(b.fullname));
      setInstitutions(sortedData);
    };

    const fetchProfessors = async () => {
      const response = await fetch('/api/getAllProfessors');
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
      institution: institutionAbbr,
      status: userType,
      email,
      password
    }
    try {
      // First create the user in Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log("Successfully created new user in Firebase.");
      
      // Only if Firebase creation succeeds, create the user in the database
      const response = await fetch(`/api/createUser`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      });
      
      if (!response.ok) {
        // If database creation fails, we should delete the Firebase user
        try {
          await userCredential.user.delete();
        } catch (deleteError) {
          console.error("Failed to clean up Firebase user after database error:", deleteError);
        }
        throw new Error('Failed to create user in database');
      }
      
      router.push('/');
    } catch (error:any) {
      setIsSubmitting(false);
      const errorCode = error.code;
      const errorMessage = error.message;
      console.error("Error creating user:", errorCode, errorMessage);
      throw error; // Re-throw to be caught by the handleSubmit function
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return; // Stop submission
    }
    setEmailError('');
    setPasswordError('');
    // Set submitting state to true
    setIsSubmitting(true);
    setError(''); // Clear any existing errors
    
    console.log("Form submission values:", {
      username,
      givenName,
      title,
      pi,
      institution, // Check if this has a value
      userType,
      email,
      password
    });
    
    // Proceed with form submission logic
    console.log('Form submitted successfully!');
    try {
      await handleSignUp(email, password);
      // Note: No need to reset isSubmitting here since we're redirecting on success
    } catch (error: any) {
      console.error("Error during signup:", error);
      
      // Provide specific error messages based on Firebase error codes
      if (error.code === 'auth/email-already-in-use') {
        setError("This email address is already registered. Please sign in or use a different email.");
      } else if (error.code === 'auth/invalid-email') {
        setError("Please enter a valid email address.");
      } else if (error.code === 'auth/weak-password') {
        setError("Please choose a stronger password. It should be at least 6 characters long.");
      } else {
        setError("Failed to create account. Please try again.");
      }
      
      setIsSubmitting(false);
    }
  };

  if (userType === "") {
    return (
      <div className="flex flex-col md:flex-row h-screen p-4 gap-4">
        <div 
          className="md:hidden h-32 bg-cover bg-center relative rounded-2xl overflow-hidden"
          style={{ 
            backgroundImage: `url('/resources/slideshow/Design-Data-class-UC-Davis 2.webp')`,
          }}>
        </div>

        <div className="w-full md:w-[600px] flex justify-center items-center bg-white p-4 md:p-12 rounded-2xl">
          <div className="w-full max-w-[380px] mx-auto">
            <div className="mb-8">
              <Link href="/">
                <img 
                  src="/resources/images/D2D_Logo.svg" 
                  alt="D2D Logo" 
                  className="h-7 mb-6 cursor-pointer hover:opacity-80 transition-opacity"
                />
              </Link>
              <h1 className="text-2xl font-semibold mb-2">Create an account</h1>
              <p className="text-sm text-gray-600">
                Already a member?{' '}
                <Link href="/login" className="text-[#06B7DB] hover:underline">
                  Sign in
                </Link>
              </p>
            </div>

            <div className="space-y-4">
              <Button 
                onClick={() => setUserType("professor")} 
                className="w-full bg-[#06B7DB] text-white hover:bg-[#05a6c7] transition-colors"
                size="md"
              >
                I am a faculty member
              </Button>
              <Button 
                onClick={() => setUserType("student")} 
                className="w-full bg-[#06B7DB] text-white hover:bg-[#05a6c7] transition-colors"
                size="md"
              >
                I am a student
              </Button>
              <Button 
                onClick={() => setUserType("neither")} 
                className="w-full text-[#06B7DB] bg-transparent hover:bg-gray-50"
              >
                I am neither a student nor faculty
              </Button>
            </div>
          </div>
        </div>
        
        <div 
          className="hidden md:block flex-1 bg-cover bg-center relative rounded-2xl overflow-hidden"
          style={{ 
            backgroundImage: `url('/resources/slideshow/Design-Data-class-UC-Davis_2.webp')`
          }}
        />
      </div>
    );
  } else if(userType === "neither") {
    return (
      <div className="flex flex-col md:flex-row h-screen p-4 gap-4">
        <div className="w-full md:w-[600px] flex justify-center items-center bg-white p-4 md:p-12 rounded-2xl">
          <div className="w-full max-w-[380px] mx-auto">
            <div className="mb-8">
            <Link href="/">

              <img 
                src="/resources/images/D2D_Logo.svg" 
                alt="D2D Logo" 
                className="h-7 mb-4"
                />
              </Link>

              <h1 className="text-2xl font-semibold mb-2">CURE Network Access</h1>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="mb-3">
                  <h2 className="text-sm font-medium text-gray-900 mb-2">Who can register?</h2>
                  <p className="text-sm text-gray-600">
                    Access is limited to members of participating undergraduate research laboratories:
                  </p>
                </div>
                
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1.5 h-1.5 bg-[#06B7DB] rounded-full"></div>
                    <p className="text-sm text-gray-700">Faculty Primary Investigators (PIs)</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-[#06B7DB] rounded-full"></div>
                    <p className="text-sm text-gray-700">Students in PI-led laboratories</p>
                  </div>
                </div>

                <div className="border-t border-blue-100 pt-3">
                  <p className="text-sm text-gray-600">
                    Need access for data submission or research collaboration? {' '}
                    <a href="mailto:webmaster@d2dcure.com" className="text-[#06B7DB] hover:underline font-medium">
                      Request access here
                    </a>
                  </p>
                </div>
              </div>

              <div className="text-center pt-2">
                <Link 
                  href="/login" 
                  className="text-sm text-[#06B7DB] hover:underline"
                >
                  Already have an account? Sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        <div 
          className="hidden md:block flex-1 bg-cover bg-center relative rounded-2xl overflow-hidden"
          style={{ 
            backgroundImage: `url('https://gbsf.ucdavis.edu/wp-content/uploads/2014/06/GBSF_building-1024x683.jpg')`
          }}
        />
      </div>
    );
  } else if (userType === "professor") {
    return (
      <div className="flex flex-col md:flex-row h-screen p-4 gap-4">
        <div className="w-full md:w-[600px] flex justify-center items-center bg-white p-4 md:p-12 rounded-2xl">
          <div className="w-full max-w-[380px] mx-auto">
            <div className="mb-8">
              <Link href="/">
                <img 
                  src="/resources/images/D2D_Logo.svg" 
                alt="D2D Logo" 
                  className="h-7 mb-4"
                />
              </Link>
              <h1 className="text-2xl font-semibold mb-2">Create faculty account</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <Input
                    id="username"
                    type="username"
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    variant="bordered"
                    size="md"
                    className="w-full text-base"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Given Name
                  </label>
                  <Input
                    id="given_name"
                    type="text"
                    placeholder="Enter given name"
                    value={givenName}
                    onChange={(e) => setGivenName(e.target.value)}
                    variant="bordered"
                    size="md"
                    className="w-full text-base"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Institution
                  </label>
                  <Select
                    id="institution"
                    placeholder="Select your Institution"
                    selectedKeys={institution ? [institution] : []}
                    onChange={(e) => {
                      const fullName = e.target.value;
                      setInstitution(fullName);
                      
                      // Find the corresponding abbreviation
                      const selected = institutions.find(inst => inst.fullname === fullName);
                      if (selected) {
                        setInstitutionAbbr(selected.abbr);
                      }
                    }}
                    variant="bordered"
                    size="md"
                    className="w-full text-base"
                    required
                    classNames={{
                      listboxWrapper: "max-h-[300px] overflow-y-auto custom-scrollbar",
                    }}
                  >
                    {institutions.map((inst: any) => (
                      <SelectItem key={inst.fullname} value={inst.fullname}>
                        {inst.fullname}
                      </SelectItem>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <Input
                    id="title"
                    type="text"
                    placeholder="Enter title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    variant="bordered"
                    size="md"
                    className="w-full text-base"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    variant="bordered"
                    size="md"
                    className="w-full text-base"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <Input
                      id="password"
                      type="password"
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => {
                        const value = e.target.value;
                        setPassword(value);

                        // Real-time validation
                        if (value.length > 0 && value.length < 6) {
                          setPasswordError('Password must be at least 6 characters long.');
                        } else {
                          setPasswordError('');
                        }
                      }}
                      variant="bordered"
                      size="md"
                      className="w-full text-base"
                      required
                    />
                    {passwordError && (
                      <p className="text-red-500 text-sm mt-1">{passwordError}</p>
                    )}

                </div>
              </div>

              <div className="flex items-center gap-2 mb-4 bg-[#06B7DB]/5 px-3 py-2 rounded-lg">
                <div className="h-12 w-2 bg-[#06B7DB] rounded-full"></div>
                <span className="text-xs text-gray-600">
                  Please use your institutional email address and create a strong password. Your account will be verified by an administrator.
                </span>
              </div>

              <button
                type="submit"
                className="w-full bg-[#06B7DB] text-white py-2 rounded-lg hover:bg-[#05a6c7] transition-colors text-sm font-medium mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating..." : "Create account"}
              </button>

              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            </form>
          </div>
        </div>
        
        <div 
          className="hidden md:block flex-1 bg-cover bg-center relative rounded-2xl overflow-hidden"
          style={{ 
            backgroundImage: `url('/resources/slideshow/Design-Data-protein-UC-Davisd.avif')`
          }}
        />
      </div>
    );
  } else if (userType === "student") {
    return (
      <div className="flex flex-col md:flex-row h-screen p-4 gap-4">
        <div className="w-full md:w-[600px] flex justify-center items-center bg-white p-4 md:p-12 rounded-2xl">
          <div className="w-full max-w-[380px] mx-auto">
            <div className="mb-8">
              <Link href="/">
              <img 
                src="/resources/images/D2D_Logo.svg" 
                alt="D2D Logo" 
                className="h-7 mb-4"
              />
              </Link>
              {/* <div className="flex items-center gap-2 mb-4 bg-[#06B7DB]/5 px-3 py-2 rounded-lg">
                <div className="h-4 w-1 bg-[#06B7DB] rounded-full"></div>
                <span className="text-sm font-medium text-gray-600">
                  Student Account
                </span>
              </div> */}
              
              
              <h2 className="text-2xl font-semibold mb-2">New User Registration</h2>

              <p>All fields required.</p>
              
              {/* // Option 1 
              
              

{/* // Option 4 - Underlined style (minimalist) */}
{/* <div className=" inline-block">
  <span className="text-sm font-medium text-gray-600 border-b-2 border-[#06B7DB] pb-1">
    Student Account
  </span>
</div> */}

{/* // Option 5 - Card style (more prominent) */}
{/* <div className="mb-4 p-3 bg-gradient-to-r from-[#06B7DB]/10 to-transparent rounded-lg border-l-4 border-[#06B7DB]">
  <span className="text-sm font-medium text-gray-600">
    Student Account
  </span>
</div> */}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  New User Name:
                </label>
                <Input
                  id="username"
                  type="username"
                  placeholder="Enter a new user name."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  variant="bordered"
                  size="md"
                  className="w-full text-base"
                  required
                />
                <small>(This is a public-facing user name that will be visible to everyone.)</small>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Given Name:
                </label>
                <Input
                  id="given_name"
                  type="text"
                  placeholder="Enter your given name."
                  value={givenName}
                  onChange={(e) => {
                    const value = e.target.value;
                    setGivenName(value);

                    if (!value.trim().includes(' ')) {
                      setGivenNameError("Please include your full name.");
                    } else {
                      setGivenNameError("");
                    }
                  }}
                  variant="bordered"
                  size="md"
                  className="w-full text-base"
                  required
                />
                {givenNameError && (
                  <p className="text-red-500 text-sm mt-1">{givenNameError}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Primary Investigator <small>(your professor)</small>:
                </label>
                <Select
                  id="pi"
                  placeholder="Select your PI."
                  selectedKeys={pi ? [pi] : []}
                  onChange={(e) => {
                    const piValue = e.target.value;
                    setpi(piValue);
                    
                    // Find the selected professor and get their institution directly
                    const selectedProf = professors.find(prof => prof.given_name === piValue);
                    if (selectedProf && selectedProf.institution) {
                      // Update both institution variables - this is the key fix
                      setInstitution(selectedProf.institution);
                      setInstitutionAbbr(selectedProf.institution);
                    }
                  }}
                  variant="bordered"
                  size="md"
                  className="w-full text-base"
                  required
                  classNames={{
                    listboxWrapper: "max-h-[300px] overflow-y-auto custom-scrollbar",
                  }}
                >
                  {professors.map((prof: any) => (
                    <SelectItem key={prof.given_name} value={prof.given_name}>
                      {`${prof.given_name} (${prof.institution})`}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  E-mail:
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your e-mail."
                  value={email}
                  onChange={(e) => {
                    const value = e.target.value;
                    setEmail(value);

                    // This error message will not prevent submission,
                    // but hopefully it will lessen invalid submissions.
                    // Some schools, like PolyU, do not have .edu in their address.
                    // TODO: Cross-reference the e-mail server with the institution website.
                    if (!value.includes(".edu")) {
                      setEmailError("E-mail address must be an institutional e-mail.");
                    } else {
                      setEmailError("");
                    }
                  }}
                  variant="bordered"
                  size="md"
                  className="w-full text-base"
                  required
                />
                {emailError && (
                  <p className="text-red-500 text-sm mt-1">{emailError}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Password
                </label>
                <Input
                    id="password"
                    type="password"
                    placeholder="Enter a secure password."
                    value={password}
                    onChange={(e) => {
                      const value = e.target.value;
                      setPassword(value);

                      // Real-time validation
                      if (value.length > 0 && value.length < 6) {
                        setPasswordError('Password must be at least 6 characters long.');
                      } else {
                        setPasswordError('');
                      }
                    }}
                    variant="bordered"
                    size="md"
                    className="w-full text-base"
                    required
                  />
                  {passwordError && (
                    <p className="text-red-500 text-sm mt-1">{passwordError}</p>
                  )}
              </div>

              <div className="flex items-center gap-2 mb-4 bg-[#06B7DB]/5 px-3 py-2 rounded-lg">
                <div className="h-12 w-2 bg-[#06B7DB] rounded-full"></div>
                <span className="text-xs text-gray-600">
                  Please use your institutional email address and create a strong password.
                  Ensure you select your correct Primary Investigator (PI).
                </span>
              </div>

              <button
                type="submit"
                className="w-full bg-[#06B7DB] text-white py-2 rounded-lg hover:bg-[#05a6c7] transition-colors text-sm font-medium mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={
                  isSubmitting ||
                  (username == '') ||
                  (!givenName.trim().includes(' ')) ||
                  (pi == '') ||
                  (email == '') ||  // TODO: Ensure that e-mail is institutional
                  (password.length < 6)
                }
              >
                {isSubmitting ? "Creating..." : "Create account"}
              </button>

              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            </form>
          </div>
        </div>
        
        <div 
          className="hidden md:block flex-1 bg-cover bg-center relative rounded-2xl overflow-hidden"
          style={{ 
            backgroundImage: `url('/resources/slideshow/Design-Data-class-UC-Davis_2.webp')`
          }}
        />
      </div>
    );
  }
}

export default SignUpPage;