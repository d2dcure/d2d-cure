import React, { useState, useEffect } from 'react';
import { Breadcrumbs, BreadcrumbItem } from "@nextui-org/breadcrumbs";
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import "../../app/globals.css";

const PublicationsPage = () => {
  const [publications, setPublications] = useState<any[]>([]);

  useEffect(() => {
    const fetchPublications = async () => {
      const response = await fetch('/api/getPublications');
      const data = await response.json();
      setPublications(data);
    };

    fetchPublications();
  }, []);

  return (
    <>
      <NavBar />
      <div className="px-6 md:px-12 lg:px-24 py-8 lg:py-10 mb-10 bg-white">
        <div className="max-w-7xl mx-auto">
          <Breadcrumbs className="mb-2">
            <BreadcrumbItem>Home</BreadcrumbItem>
            <BreadcrumbItem>Resources</BreadcrumbItem>
            <BreadcrumbItem>Publications</BreadcrumbItem>
          </Breadcrumbs>

          <div className="pt-8">
            <h1 className="mb-4 text-3xl md:text-4xl lg:text-5xl font-inter dark:text-white">
              Publications
            </h1>
            <p className="max-w-2xl mb-8 text-base md:text-lg lg:text-xl text-gray-500 dark:text-gray-200">
              The following papers are related to the D2D Project.
            </p>

            <ol className="list-decimal space-y-6 pl-6">
              {publications.map((publication) => (
                <li 
                  key={publication.id} 
                  className="text-sm md:text-base leading-relaxed text-gray-700"
                >
                  {publication.all_authors}{" "}
                  <span className="font-semibold">
                    ({publication.year})
                  </span>{" "}
                  &quot;{publication.title}&quot;{" "}
                  <a
                    href={publication.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    {publication.journal}, {publication.volume}
                    {publication.issue && `(${publication.issue})`}, 
                    {publication.first_page}
                  </a>
                </li>
              ))}
              
              {/* Fallback for when API is not available */}
              {publications.length === 0 && (
                <>
                  <li className="text-sm md:text-base leading-relaxed text-gray-700">
                    Carlin, D.A.; Caster, R.W.; Wang, X.; Betzenderfer, S.A.; Chen, C.X.; Duong, V.M.; Ryklansky, C.V.; Alpekin, A.; Beaumont, N.; Kapoor, H.; Kim, N.; Mohabbot, H.; Pang, B.; Teel, R.; Whithaus, L.; Tagkopoulos, I.; & Siegel, J.B. (2016) "Kinetic Characterization of 100 Glycoside Hydrolase Mutants Enables the Discovery of Structural Features Correlated with Kinetic Constants." PLoS ONE 11(1), e0147596.
                  </li>
                  <li className="text-sm md:text-base leading-relaxed text-gray-700">
                    Carlin, D.A.; Hapig-Ward S.; Chan, B.W.; Damrau, N.; Riley, M.; Caster, R.W.; Bethards, B.; & Siegel, J.B. (2017) "Thermal stability and kinetic constants for 129 variants of a family 1 glycoside hydrolase reveal that enzyme activity and stability can be separately designed." PLoS ONE 12(5), e0176255.
                  </li>
                  <li className="text-sm md:text-base leading-relaxed text-gray-700">
                    Huang, P.; Chu, S.K.; Frizzo, H.N.; Connolly, M.P.; Caster, R.W.; & Siegel, J. B. (2020) "Evaluating Protein Engineering Thermostability Prediction Tools Using an Independently Generated Dataset." ACS Omega 5(12), 6487–6493.
                  </li>
                </>
              )}
            </ol>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default PublicationsPage;