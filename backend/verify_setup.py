#!/usr/bin/env python3
"""
AI Resume Scout - System Verification Script
This script checks if all components are properly configured and ready to run.
"""

import os
import sys
import subprocess
import json
from pathlib import Path

def check_python_version():
    """Check if Python version is compatible."""
    print("🐍 Checking Python version...")
    version = sys.version_info
    if version.major == 3 and version.minor >= 8:
        print(f"✅ Python {version.major}.{version.minor}.{version.micro} is compatible")
        return True
    else:
        print(f"❌ Python {version.major}.{version.minor} is not compatible. Requires Python 3.8+")
        return False

def check_node_version():
    """Check if Node.js is installed and compatible."""
    print("📦 Checking Node.js version...")
    try:
        result = subprocess.run(['node', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            version = result.stdout.strip()
            print(f"✅ Node.js {version} is installed")
            return True
    except FileNotFoundError:
        pass
    
    print("❌ Node.js is not installed or not in PATH")
    return False

def check_backend_dependencies():
    """Check if backend Python dependencies can be imported."""
    print("🔧 Checking backend dependencies...")
    
    required_packages = [
        'fastapi',
        'uvicorn',
        'pydantic',
        'python_dotenv',
        'PyPDF2',
        'python_docx',
        'pdfplumber'
    ]
    
    missing = []
    for package in required_packages:
        try:
            __import__(package.replace('-', '_').replace('python_', ''))
        except ImportError:
            missing.append(package)
    
    if missing:
        print(f"❌ Missing Python packages: {', '.join(missing)}")
        print("💡 Run: pip install -r requirements_optimized.txt")
        return False
    else:
        print("✅ All required Python packages are installed")
        return True

def check_environment_config():
    """Check environment configuration."""
    print("⚙️ Checking environment configuration...")
    
    env_file = Path('.env')
    if not env_file.exists():
        print("⚠️ No .env file found. Using default configuration.")
        return True
    
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    openai_key = os.getenv('OPENAI_API_KEY')
    google_key = os.getenv('GOOGLE_AI_API_KEY')
    
    if openai_key and openai_key.strip():
        print("✅ OpenAI API key is configured")
    elif google_key and google_key.strip():
        print("✅ Google AI API key is configured")
    else:
        print("⚠️ No AI API keys configured - will use fallback methods")
        print("💡 Add OPENAI_API_KEY or GOOGLE_AI_API_KEY to .env for better results")
    
    return True

def check_directories():
    """Check if required directories exist."""
    print("📁 Checking required directories...")
    
    dirs_to_check = [
        'uploads',
        'vector_db',
        'data/resumes'
    ]
    
    for dir_path in dirs_to_check:
        path = Path(dir_path)
        if not path.exists():
            try:
                path.mkdir(parents=True, exist_ok=True)
                print(f"✅ Created directory: {dir_path}")
            except Exception as e:
                print(f"❌ Failed to create directory {dir_path}: {e}")
                return False
        else:
            print(f"✅ Directory exists: {dir_path}")
    
    return True

def check_frontend_setup():
    """Check if frontend is properly set up."""
    print("🎨 Checking frontend setup...")
    
    frontend_path = Path('../ai-resume-scout')
    if not frontend_path.exists():
        print("❌ Frontend directory not found")
        return False
    
    package_json = frontend_path / 'package.json'
    if not package_json.exists():
        print("❌ package.json not found in frontend directory")
        return False
    
    print("✅ Frontend directory structure is correct")
    return True

def test_backend_import():
    """Test if backend can be imported without errors."""
    print("🧪 Testing backend imports...")
    
    try:
        from app.main import app
        print("✅ Backend imports successfully")
        return True
    except Exception as e:
        print(f"❌ Backend import failed: {e}")
        return False

def main():
    """Run all checks."""
    print("=" * 50)
    print("🔍 AI Resume Scout - System Verification")
    print("=" * 50)
    print()
    
    checks = [
        check_python_version,
        check_node_version,
        check_backend_dependencies,
        check_environment_config,
        check_directories,
        check_frontend_setup,
        test_backend_import
    ]
    
    results = []
    for check in checks:
        result = check()
        results.append(result)
        print()
    
    print("=" * 50)
    print("📋 VERIFICATION SUMMARY")
    print("=" * 50)
    
    passed = sum(results)
    total = len(results)
    
    if passed == total:
        print(f"🎉 ALL CHECKS PASSED ({passed}/{total})")
        print()
        print("✅ Your system is ready to run AI Resume Scout!")
        print("📝 To start the application:")
        print("   • Backend: run start_backend.bat")
        print("   • Frontend: run start_frontend.bat")
        print("   • Both: run START_PROJECT.bat")
    else:
        print(f"⚠️ ISSUES FOUND ({passed}/{total} checks passed)")
        print()
        print("Please fix the issues above before starting the application.")
    
    return passed == total

if __name__ == "__main__":
    os.chdir(Path(__file__).parent)  # Change to backend directory
    success = main()
    
    if not success:
        input("\nPress Enter to exit...")
        sys.exit(1)