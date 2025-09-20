import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    // <div className="flex min-h-screen items-center justify-center bg-gray-100">



        <div className="flex min-h-screen items-center justify-center  h-screen flex flex-col bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white overflow-hidden">
          <div className="flex-1 flex flex-col lg:flex-row gap-6 p-6 min-h-0">
            <div className="flex-1 flex flex-col min-w-0">
                    <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-gray-600">deo co gi dau \n tutu ghi sau</p>
        <a href="/" className="text-blue-500 underline hover:text-blue-700">
          tutu ghi sau....
        </a>
             </div>
                 </div>
          </div>
        </div>
  );
};

export default NotFound;
