"""
CSV Data Import Management Command
Imports ALL records from UP_Complete CSV files without data loss
"""
import csv
import os
from django.core.management.base import BaseCommand
from django.db import transaction
from apps.scanner.models import CropInsectData
from pathlib import Path


class Command(BaseCommand):
    help = 'Import crop-insect data from CSV files - COMPLETE DATA IMPORT'

    def add_arguments(self, parser):
        parser.add_argument(
            '--file',
            type=str,
            help='Path to CSV file (or import all 3 files if not specified)',
        )
        parser.add_argument(
            '--batch-size',
            type=int,
            default=1000,
            help='Batch size for bulk insert (default: 1000)',
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before import',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write(self.style.WARNING('Clearing existing data...'))
            CropInsectData.objects.all().delete()
            self.stdout.write(self.style.SUCCESS('✓ Data cleared'))

        # Determine which files to import
        if options['file']:
            files = [options['file']]
        else:
            # Import all 3 CSV files
            base_dir = Path(__file__).resolve().parent.parent.parent.parent.parent
            files = [
                base_dir / 'UP_Complete_PART1.csv',
                base_dir / 'UP_Complete_PART2.csv',
                base_dir / 'UP_Complete_PART3.csv',
            ]

        total_imported = 0
        total_errors = 0

        for file_path in files:
            if not os.path.exists(file_path):
                self.stdout.write(self.style.ERROR(f'✗ File not found: {file_path}'))
                continue

            self.stdout.write(self.style.NOTICE(f'\n[FILE] Processing: {os.path.basename(file_path)}'))
            imported, errors = self.import_file(file_path, options['batch_size'])
            total_imported += imported
            total_errors += errors

        self.stdout.write(self.style.SUCCESS(f'\n[SUCCESS] IMPORT COMPLETE'))
        self.stdout.write(self.style.SUCCESS(f'   Total Records Imported: {total_imported:,}'))
        if total_errors > 0:
            self.stdout.write(self.style.WARNING(f'   Total Errors: {total_errors:,}'))
        self.stdout.write(self.style.SUCCESS(f'   Database Total: {CropInsectData.objects.count():,}'))

    def import_file(self, file_path, batch_size):
        """Import single CSV file with batch processing"""
        imported_count = 0
        error_count = 0
        batch = []

        try:
            with open(file_path, 'r', encoding='utf-8', errors='replace') as csvfile:
                # Read CSV
                reader = csv.DictReader(csvfile)
                
                for row_num, row in enumerate(reader, start=2):  # Start at 2 (header is 1)
                    try:
                        # Clean and prepare data
                        crop_data = CropInsectData(
                            district=self.clean_text(row.get('District', '')),
                            village=self.clean_text(row.get('Village', '')),
                            pincode=self.clean_text(row.get('pincode', '')),
                            season=self.clean_text(row.get('Season', '')),
                            crop=self.clean_text(row.get('Crop', '')),
                            
                            insect_name=self.clean_text(row.get('Insect_Name', '')),
                            insect_nickname=self.clean_text(row.get('Insect_Nickname', '')),
                            insect_hindi_name=self.clean_text(row.get('Insect_Hindi_Name', '')),
                            insect_common_name=self.clean_text(row.get('Insect_Common_Name', '')),
                            insect_type=self.clean_text(row.get('Insect_Type', '')),
                            
                            damage_type=self.clean_text(row.get('Damage_Type', '')),
                            how_to_recognize=self.clean_text(row.get('How_To_Recognize', '')),
                            best_control_time=self.clean_text(row.get('Best_Control_Time', '')),
                            pesticide_options=self.clean_text(row.get('Pesticide_Options', '')),
                            mrp_2026=self.clean_text(row.get('MRP_2026', '')),
                            application_method=self.clean_text(row.get('Application_Method', '')),
                        )
                        
                        batch.append(crop_data)
                        
                        # Bulk insert when batch is full
                        if len(batch) >= batch_size:
                            with transaction.atomic():
                                CropInsectData.objects.bulk_create(batch, ignore_conflicts=False)
                            imported_count += len(batch)
                            self.stdout.write(f'  [OK] Imported {imported_count:,} records...', ending='\r')
                            self.stdout.flush()
                            batch = []
                            
                    except Exception as e:
                        error_count += 1
                        if error_count <= 10:  # Show first 10 errors
                            self.stdout.write(self.style.ERROR(f'\n  [ERROR] Error at row {row_num}: {str(e)}'))
                
                # Insert remaining batch
                if batch:
                    with transaction.atomic():
                        CropInsectData.objects.bulk_create(batch, ignore_conflicts=False)
                    imported_count += len(batch)
                
                self.stdout.write(f'\n  [OK] Imported {imported_count:,} records from {os.path.basename(file_path)}')
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'\n  [ERROR] File error: {str(e)}'))
            
        return imported_count, error_count

    def clean_text(self, text):
        """Clean and normalize text data"""
        if not text or text == 'nan':
            return ''
        
        # Convert to string and strip whitespace
        text = str(text).strip()
        
        # Handle numeric values
        if text.endswith('.0'):
            text = text[:-2]
        
        return text
