import mysql.connector
from mysql.connector import Error
from datetime import datetime, timedelta
import random

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'database': 'dresstest',
    'user': 'root',
    'password': 'root',
    'port': 3306
}

def create_connection():
    """Create database connection"""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        return connection
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None

def add_dummy_data():
    """Add dummy data to all tables"""
    connection = create_connection()
    if not connection:
        return
    
    try:
        cursor = connection.cursor()
        
        # Add dummy admins
        print("Adding dummy admins...")
        admin_data = [
            ('security_admin', 'password123', 'Security'),
            ('osas_admin', 'password123', 'OSAS'),
            ('dean_admin', 'password123', 'Dean'),
            ('guidance_admin', 'password123', 'Guidance')
        ]
        
        admin_query = "INSERT INTO admins (username, password, role) VALUES (%s, %s, %s)"
        cursor.executemany(admin_query, admin_data)
        
        # Add dress code requirements
        print("Adding dress code requirements...")
        requirements_data = [
            ('Male', 'Polo Shirt'),
            ('Male', 'Black Pants'),
            ('Male', 'Shoes'),
            ('Female', 'Blouse'),
            ('Female', 'Skirt'),
            ('Female', 'Shoes')
        ]
        
        requirements_query = "INSERT INTO requirements (gender, item_name) VALUES (%s, %s)"
        cursor.executemany(requirements_query, requirements_data)
        
        # Add dummy students
        print("Adding dummy students...")
        students_data = [
            ('RFID001', 'John', 'Doe', 'Male', 'Computer Science', 3),
            ('RFID002', 'Jane', 'Smith', 'Female', 'Information Technology', 2),
            ('RFID003', 'Mike', 'Johnson', 'Male', 'Engineering', 4),
            ('RFID004', 'Sarah', 'Williams', 'Female', 'Business Administration', 1),
            ('RFID005', 'David', 'Brown', 'Male', 'Computer Science', 2),
            ('RFID006', 'Emily', 'Davis', 'Female', 'Information Technology', 3),
            ('RFID007', 'Chris', 'Miller', 'Male', 'Engineering', 1),
            ('RFID008', 'Ashley', 'Wilson', 'Female', 'Business Administration', 4),
            ('RFID009', 'James', 'Moore', 'Male', 'Computer Science', 3),
            ('RFID010', 'Jessica', 'Taylor', 'Female', 'Information Technology', 2)
        ]
        
        students_query = """
        INSERT INTO students (rfid_tag, first_name, last_name, gender, course, year_level) 
        VALUES (%s, %s, %s, %s, %s, %s)
        """
        cursor.executemany(students_query, students_data)
        
        # Get student IDs for violations
        cursor.execute("SELECT student_id FROM students")
        student_ids = [row[0] for row in cursor.fetchall()]
        
        # Add dummy violations
        print("Adding dummy violations...")
        violations_data = []
        missing_items = ['Polo Shirt', 'Black Pants', 'Shoes', 'Blouse', 'Skirt']
        locations = ['Main Gate', 'Building A', 'Building B', 'Cafeteria', 'Library']
        statuses = ['Pending', 'Acknowledged', 'Forwarded to OSAS', 'Resolved']
        
        for i in range(15):  # Add 15 dummy violations
            student_id = random.choice(student_ids)
            missing_item = random.choice(missing_items)
            location = random.choice(locations)
            status = random.choice(statuses)
            # Random date within last 30 days
            detected_at = datetime.now() - timedelta(days=random.randint(0, 30))
            
            violations_data.append((student_id, missing_item, detected_at, location, status))
        
        violations_query = """
        INSERT INTO violations (student_id, missing_item, detected_at, location, status) 
        VALUES (%s, %s, %s, %s, %s)
        """
        cursor.executemany(violations_query, violations_data)
        
        # Get violation IDs for case notes
        cursor.execute("SELECT violation_id FROM violations")
        violation_ids = [row[0] for row in cursor.fetchall()]
        
        # Get admin IDs for case notes
        cursor.execute("SELECT admin_id FROM admins")
        admin_ids = [row[0] for row in cursor.fetchall()]
        
        # Add dummy case notes
        print("Adding dummy case notes...")
        case_notes_data = []
        sample_notes = [
            "Student was advised about dress code policy",
            "First violation - verbal warning given",
            "Student showed understanding of requirements",
            "Follow-up meeting scheduled",
            "Parent contacted regarding repeated violations",
            "Student provided explanation for violation",
            "Referred to guidance counselor",
            "Violation resolved - student complied"
        ]
        
        for i in range(10):  # Add 10 dummy case notes
            violation_id = random.choice(violation_ids)
            admin_id = random.choice(admin_ids)
            note = random.choice(sample_notes)
            
            case_notes_data.append((violation_id, admin_id, note))
        
        case_notes_query = """
        INSERT INTO case_notes (violation_id, admin_id, note) 
        VALUES (%s, %s, %s)
        """
        cursor.executemany(case_notes_query, case_notes_data)
        
        connection.commit()
        print("Dummy data added successfully!")
        
        # Display summary
        cursor.execute("SELECT COUNT(*) FROM admins")
        admin_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM students")
        student_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM violations")
        violation_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM case_notes")
        notes_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM requirements")
        requirements_count = cursor.fetchone()[0]
        
        print(f"\nData Summary:")
        print(f"Admins: {admin_count}")
        print(f"Students: {student_count}")
        print(f"Violations: {violation_count}")
        print(f"Case Notes: {notes_count}")
        print(f"Requirements: {requirements_count}")
        
    except Error as e:
        print(f"Error adding dummy data: {e}")
        connection.rollback()
    finally:
        cursor.close()
        connection.close()

if __name__ == "__main__":
    print("Adding dummy data to dresstest database...")
    add_dummy_data()
