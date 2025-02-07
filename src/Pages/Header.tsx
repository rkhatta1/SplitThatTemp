import React from 'react'

type Props = {}

const Header = (props: Props) => {
  return (
    <div>
        <div className='container min-w-full mx-auto py-[2rem] sticky top-0 bg-gray-500 backdrop-opacity-20 backdrop-blur-md justify-center'>
            <div className='text-2xl font-bold text-center text-white'>SplitThat - Logo Goes Here</div>
        </div>
    </div>
  )
}

export default Header