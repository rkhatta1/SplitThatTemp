'use client'

import React, { useEffect, useRef } from "react";
import "@/Styles/Home.css";

type Props = {};

const HomePage = (props: Props) => {
  const features = {
    completed: ["Feature 1", "Feature 2"],
    currentlyBuilding: ["Feature 3"],
    future: ["Feature 4", "Feature 5"]
  };

  const currentlyBuildingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentlyBuildingRef.current) {
      currentlyBuildingRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  return (
    <div>
      <div className="container mx-auto justify-center h-full">
        <div className="flex flex-col h-[15rem] scroll-container">
          <div className="flex flex-col overflow-y-scroll text-black scrollableFeatureList font-bold text-center text-lg">
            {Object.entries(features).map(([category, featureList], categoryIndex) => (
              <div
                key={categoryIndex}
                ref={categoryIndex === 1 ? currentlyBuildingRef : null}
                className={`${categoryIndex === 1 ? "text-2xl" : ""} ${categoryIndex === 0 ? "text-cyan-800" : ""} ${categoryIndex === 2 ? "text-gray-400" : ""}`}
              >
                {featureList.map((feature: any, featureIndex: any) => (
                  <div key={featureIndex} className="flex flex-col items-center mb-[0.4rem]">
                    <div className="text-center">{feature}</div>
                    <div className={`${categoryIndex == 1 ? "text-gray-400 text-lg" : ""} ${categoryIndex == 0 && featureIndex == (featureList.length - 1) ? "text-black" : ""} ${categoryIndex == 2 && featureIndex == (featureList.length - 1) ? "hidden" : ""}`}>|</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;