import React, { useEffect, useRef } from "react";
import "@/Styles/Home.css";
import FeatureList from "@/Components/FeatureList";

type Props = {};

const HomePage = (props: Props) => {

  return (
    <div>
      <div className="container mx-auto flex flex-col space-y-[1.5rem] justify-center h-full">
          <div className="mx-auto">
            <div className="text-[2rem] font-bold text-start text-white">Current Progress</div>
        <div className="flex flex-col h-[15rem] scroll-container">
          <FeatureList />
        </div>
          </div>
      </div>
    </div>
  );
};

export default HomePage;