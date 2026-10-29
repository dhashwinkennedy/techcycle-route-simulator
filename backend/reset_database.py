"""Back up then reset only the project-local SQLite database."""
import argparse, shutil
from datetime import datetime
from pathlib import Path
from app.database import DATABASE_URL
from seed_demo import seed
def local_db():
 if not DATABASE_URL.startswith('sqlite:///') or DATABASE_URL.startswith('sqlite:////'):raise RuntimeError('Refusing reset: database is not project-local SQLite.')
 path=Path(DATABASE_URL.removeprefix('sqlite:///')).resolve()
 if Path.cwd().resolve() not in path.parents:raise RuntimeError('Refusing reset: database lies outside project.')
 return path
def main():
 p=argparse.ArgumentParser();p.add_argument('--confirm-reset',action='store_true');a=p.parse_args()
 if not a.confirm_reset:p.error('Refusing destructive action. Use --confirm-reset.')
 db=local_db();backup=None
 if db.exists():
  d=Path('backups');d.mkdir(exist_ok=True);backup=d/f'{db.stem}-{datetime.now().strftime("%Y%m%d-%H%M%S")}.db';shutil.copy2(db,backup)
 print({'backup':str(backup) if backup else None,**seed(reset=True)})
if __name__=='__main__':main()
