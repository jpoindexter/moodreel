'use client'

import { ThemeToggle } from '@/components/ThemeToggle'

export default function ThemeTest() {
    return (
        <div className="min-h-screen p-8">
            <div className="navbar bg-base-200 rounded-box mb-8">
                <div className="navbar-start">
                    <h1 className="text-xl font-bold">Theme Test Page</h1>
                </div>
                <div className="navbar-end">
                    <ThemeToggle />
                </div>
            </div>

            <div className="prose max-w-none">
                <h2>DaisyUI Component Showcase</h2>
                <p className="text-base-content/70">
                    Switch themes using the palette icon above. You should see significant color changes.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                {/* Buttons */}
                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                        <h3 className="card-title">Buttons</h3>
                        <div className="flex flex-wrap gap-2">
                            <button className="btn btn-primary">Primary</button>
                            <button className="btn btn-secondary">Secondary</button>
                            <button className="btn btn-accent">Accent</button>
                            <button className="btn btn-success">Success</button>
                            <button className="btn btn-error">Error</button>
                            <button className="btn btn-warning">Warning</button>
                        </div>
                    </div>
                </div>

                {/* Badges */}
                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                        <h3 className="card-title">Badges</h3>
                        <div className="flex flex-wrap gap-2">
                            <span className="badge badge-primary">Primary</span>
                            <span className="badge badge-secondary">Secondary</span>
                            <span className="badge badge-accent">Accent</span>
                            <span className="badge badge-success">Success</span>
                            <span className="badge badge-error">Error</span>
                            <span className="badge badge-warning">Warning</span>
                        </div>
                    </div>
                </div>

                {/* Alerts */}
                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                        <h3 className="card-title">Alerts</h3>
                        <div className="alert alert-info mb-2">
                            <span>Info alert</span>
                        </div>
                        <div className="alert alert-success mb-2">
                            <span>Success alert</span>
                        </div>
                        <div className="alert alert-error">
                            <span>Error alert</span>
                        </div>
                    </div>
                </div>

                {/* Colors */}
                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                        <h3 className="card-title">Color Palette</h3>
                        <div className="space-y-2">
                            <div className="bg-primary text-primary-content p-2 rounded">Primary</div>
                            <div className="bg-secondary text-secondary-content p-2 rounded">Secondary</div>
                            <div className="bg-accent text-accent-content p-2 rounded">Accent</div>
                            <div className="bg-neutral text-neutral-content p-2 rounded">Neutral</div>
                        </div>
                    </div>
                </div>

                {/* Inputs */}
                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                        <h3 className="card-title">Inputs</h3>
                        <input type="text" placeholder="Default input" className="input input-bordered w-full mb-2" />
                        <input type="text" placeholder="Primary input" className="input input-bordered input-primary w-full mb-2" />
                        <input type="text" placeholder="Secondary input" className="input input-bordered input-secondary w-full" />
                    </div>
                </div>

                {/* Stats */}
                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                        <h3 className="card-title">Stats</h3>
                        <div className="stats shadow bg-base-200">
                            <div className="stat">
                                <div className="stat-title">Total Views</div>
                                <div className="stat-value text-primary">25.6K</div>
                                <div className="stat-desc">21% more than last month</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 p-6 bg-base-200 rounded-box">
                <h3 className="text-lg font-bold mb-4">Current Theme Variables</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <div className="font-mono text-xs mb-1">bg-base-100</div>
                        <div className="h-12 bg-base-100 border border-base-300 rounded"></div>
                    </div>
                    <div>
                        <div className="font-mono text-xs mb-1">bg-base-200</div>
                        <div className="h-12 bg-base-200 border border-base-300 rounded"></div>
                    </div>
                    <div>
                        <div className="font-mono text-xs mb-1">bg-base-300</div>
                        <div className="h-12 bg-base-300 border border-base-300 rounded"></div>
                    </div>
                    <div>
                        <div className="font-mono text-xs mb-1">bg-primary</div>
                        <div className="h-12 bg-primary rounded"></div>
                    </div>
                    <div>
                        <div className="font-mono text-xs mb-1">bg-secondary</div>
                        <div className="h-12 bg-secondary rounded"></div>
                    </div>
                    <div>
                        <div className="font-mono text-xs mb-1">bg-accent</div>
                        <div className="h-12 bg-accent rounded"></div>
                    </div>
                    <div>
                        <div className="font-mono text-xs mb-1">text-base-content</div>
                        <div className="h-12 bg-base-100 border border-base-300 rounded flex items-center justify-center">
                            <span className="text-base-content font-bold">Text</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
