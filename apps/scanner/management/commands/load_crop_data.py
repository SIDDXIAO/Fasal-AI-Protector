"""
Management command to import crop-insect CSV data into database
"""
from django.core.management.base import BaseCommand
import pandas as pd
from apps.scanner.models import CropInsectData
import os

class Command(BaseCommand):
    help = 'Import crop-insect data from CSV files'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--file',
            type=str,
            help='Path to CSV file',
            default=None
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before import'
        )
    
    def handle(self, *args, **options):
        csv_file = options.get('file')
        clear_data = options.get('clear')
        
        if clear_data:
            self.stdout.write('Clearing existing data...')
            CropInsectData.objects.all().delete()
            self.stdout.write(self.style.SUCCESS('✅ Data cleared'))
        
        if not csv_file:
            self.stdout.write(self.style.WARNING('No file specified. Use --file path/to/file.csv'))
            return
        
        if not os.path.exists(csv_file):
            self.stdout.write(self.style.ERROR(f'File not found: {csv_file}'))
            return
        
        self.stdout.write(f'Loading data from: {csv_file}')
        
        try:
            # Read CSV
            df = pd.read_csv(csv_file)
            total = len(df)
            
            self.stdout.write(f'Found {total:,} rows')
            
            # Batch insert
            batch_size = 1000
            batch = []
            imported = 0
            
            for idx, row in df.iterrows():
                obj = CropInsectData(
                    district=row.get('District', ''),
                    village=row.get('Village', ''),
                    pincode=row.get('pincode'),
                    season=row.get('Season', ''),
                    crop=row.get('Crop', ''),
                    insect_name=row.get('Insect_Name', ''),
                    insect_nickname=row.get('Insect_Nickname'),
                    insect_hindi_name=row.get('Insect_Hindi_Name'),
                    insect_common_name=row.get('Insect_Common_Name'),
                    insect_type=row.get('Insect_Type'),
                    damage_type=row.get('Damage_Type'),
                    how_to_recognize=row.get('How_To_Recognize'),
                    best_control_time=row.get('Best_Control_Time'),
                    pesticide_options=row.get('Pesticide_Options'),
                    mrp_2026=row.get('MRP_2026'),
                    application_method=row.get('Application_Method')
                )
                batch.append(obj)
                
                if len(batch) >= batch_size:
                    CropInsectData.objects.bulk_create(batch, ignore_conflicts=True)
                    imported += len(batch)
                    batch = []
                    self.stdout.write(f'Imported {imported:,}/{total:,} rows...', ending='\r')
            
            # Insert remaining
            if batch:
                CropInsectData.objects.bulk_create(batch, ignore_conflicts=True)
                imported += len(batch)
            
            self.stdout.write('')
            self.stdout.write(self.style.SUCCESS(f'✅ Successfully imported {imported:,} rows'))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Import failed: {str(e)}'))
