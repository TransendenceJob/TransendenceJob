import React, {JSX, useState, useEffect, useRef } from 'react';

interface UserSearchFormProps {
    onSearch: (query: string) => void;
}

export function UserSearchForm({ onSearch }: UserSearchFormProps): JSX.Element {
    const [searchTerm, setSearchTerm] = useState('');
    const isInitialRender = useRef(true);

    useEffect(() => {
        if (isInitialRender.current) {
            isInitialRender.current = false;
            return;
        }

        // Wait 500ms after the user stops typing before searching
        const delayDebounceTimeout = setTimeout(() => {
            onSearch(searchTerm);
        }, 500);

        return () => clearTimeout(delayDebounceTimeout);
    }, [searchTerm, onSearch]);

    return (
        <div className="mb-6">
            <label htmlFor="user-search" className="block text-sm font-medium text-gray-700">
                Search Users
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
                <input
                    type="text"
                    name="user-search"
                    id="user-search"
                    className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                    placeholder="Search by username or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <p className="mt-2 text-xs text-gray-500">Searching by username, email, or ID...</p>
        </div>
    );
}