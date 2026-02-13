import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield } from 'lucide-react';

const Profile = () => {
    const { user } = useAuth();

    return (
        <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Profile</h2>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 h-32 w-full relative">
                    <div className="absolute -bottom-12 left-8">
                        <div className="h-24 w-24 rounded-full bg-white dark:bg-gray-800 p-1">
                            <div className="h-full w-full rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-3xl font-bold text-gray-600 dark:text-gray-300">
                                {user?.name?.charAt(0) || 'U'}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-16 pb-8 px-8">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{user?.name}</h3>
                    <p className="text-gray-500 dark:text-gray-400">Administrator</p>

                    <div className="mt-8 space-y-6">
                        <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <User className="h-6 w-6 text-indigo-600 dark:text-indigo-400 mr-4" />
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Full Name</p>
                                <p className="text-lg font-semibold text-gray-900 dark:text-white">{user?.name}</p>
                            </div>
                        </div>

                        <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <Mail className="h-6 w-6 text-indigo-600 dark:text-indigo-400 mr-4" />
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email Address</p>
                                <p className="text-lg font-semibold text-gray-900 dark:text-white">{user?.email}</p>
                            </div>
                        </div>

                        <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <Shield className="h-6 w-6 text-indigo-600 dark:text-indigo-400 mr-4" />
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Role</p>
                                <p className="text-lg font-semibold text-gray-900 dark:text-white">{user?.isAdmin ? 'Super Admin' : 'User'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
