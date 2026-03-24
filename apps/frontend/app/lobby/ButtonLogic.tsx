'use client';

import { useState } from 'react';

export default function ButtonLogic() {
  const [count, setCount] = useState(-2);

  return (
	<div className="flex flex-col items-center gap-4 p-6 border-2 border-gray-200 rounded-xl shadow-sm">
      <h2 className="text-2xl font-bold">Current Value: {count}</h2>
      <button onClick={() => {setCount(count + 1)}} 
        className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 active:scale-95 transition-all shadow-md"
      >Increase</button>
    </div>
  );
}
