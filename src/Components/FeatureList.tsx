"use client";

import React, { useEffect, useRef } from "react";
import "@/Styles/Home.css";

type Props = {};

const FeatureList = (props: Props) => {
  const features = {
    completed: ["OAth", "OCR Text Etraction", "NLP Prompt Recognition"],
    currentlyBuilding: ["AI-Powered Expense Splitting"],
    future: ["Splitwise API integration", "Legacy Data Visualization", "More features coming soon!"],
  };

  const currentlyBuildingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentlyBuildingRef.current) {
      currentlyBuildingRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  return (
    <div className="flex flex-col overflow-y-scroll py-[1rem] text-black scrollableFeatureList font-bold text-[1rem]">
      {Object.entries(features).map(
        ([category, featureList], categoryIndex) => (
          <div
            key={categoryIndex}
            ref={categoryIndex === 1 ? currentlyBuildingRef : null}
            className={`${
              categoryIndex === 1 ? "text-[1.3rem] text-white" : ""
            } ${categoryIndex === 0 ? "text-white" : ""} ${
              categoryIndex === 2 ? "text-white text-opacity-40" : ""
            } `}
          >
            {featureList.map((feature: any, featureIndex: any) => (
              <div
                key={featureIndex}
                className="flex flex-col text-start mb-[0.4rem]"
              >
                <div className={`text-start ${categoryIndex == 1 ? "animate-pulse" : ""}`}>{feature}</div>
                <div
                  className={`${
                    categoryIndex == 1 ? "text-white text-opacity-40 text-lg" : ""
                  } ${
                    categoryIndex == 0 && featureIndex == featureList.length - 1
                      ? "text-white"
                      : ""
                  } ${
                    categoryIndex == 2 && featureIndex == featureList.length - 1
                      ? "hidden"
                      : ""
                  }`}
                >
                  |
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default FeatureList;
