from webdav3.client import Client
import os
import re
import datetime
import hashlib
from yaml import load, dump
from rich.progress import Progress
from yaml import Loader, Dumper

serverRoot = '/web/IFLab'
mappings = [
    ['dist/spa', '/web/IFLab'],
]
ignores = [
    'config.ini',
]
version = '0.1'


class FileMapping:
  ignorePatterns = [re.compile(i) for i in ignores]

  def __init__(self, sourceFile, targetFile):
    self.sourceFile = sourceFile
    self.targetFile = targetFile
    self.ignore = self.__checkIgnore()
    if not self.ignore:
      self.__prepare()

  def __checkIgnore(self):
    for p in FileMapping.ignorePatterns:
      if (p.search(self.sourceFile)):
        return True
    return False

  def __prepare(self):
    f = open(self.sourceFile, 'rb')
    bs = f.read()
    f.close()
    self.hash = hashlib.sha512(bs).hexdigest()
    self.fileLength = len(bs)

  def __repr__(self):
    return 'M: {}  {}'.format(self.sourceFile, self.targetFile)


def prepareFileMappings():
  fileMappings = []
  for mapping in mappings:
    source = mapping[0]
    target = mapping[1]
    filter = (lambda file: True) if len(mapping) <= 2 else mapping[2]

    for path, dir_list, file_list in os.walk(source):
      targetPath = os.path.join(target, os.path.relpath(path, source))
      for file in file_list:
        sourceFile = os.path.join(path, file).replace('\\.\\', '\\').replace('\\', '/')
        targetFile = os.path.join(targetPath, file).replace('\\.\\', '\\').replace('\\', '/')
        if filter(sourceFile):
          fileMappings.append(FileMapping(sourceFile, targetFile))

  fileMappings = [fm for fm in fileMappings if not fm.ignore]
  return fileMappings


def prepareSourceFileStructure(fileMappings):
  mappings = []
  for fm in fileMappings:
    mappings.append({
        'url': fm.targetFile,
        'size': fm.fileLength,
        'sha512': fm.hash
    })
  date = datetime.datetime.now()
  return {
      'files': mappings,
      'releaseDate': date.isoformat(),
      'version': '{}.{}'.format(version, f'{date:%Y%m%d%H%M%S}')
  }


def loadTargetFileStructure(remote, path, filename):
  if not (filename in remote.list(path)):
    return {
        'files': []
    }

  localFile = '/tmp/summary.yml'
  remote.download_sync(remote_path=os.path.join(path, filename), local_path=localFile)
  f = open(localFile, 'r')
  yml = f.read()
  f.close()
  return load(yml, Loader=Loader)


def differential(fileMappings, sourceFileStructure, targetFileStructure):
  def fileMap(fs):
    fs = fs['files']
    fm = {}
    for f in fs:
      fm[f['url']] = f
    return fm

  sourceFileMap = fileMap(sourceFileStructure)
  targetFileMap = fileMap(targetFileStructure)

  actions = []

  for fileMapping in fileMappings:
    url = fileMapping.targetFile
    if (targetFileMap.__contains__(url)):
      if not (sourceFileMap[url]['sha512'] == targetFileMap[url]['sha512']):
        actions.append(['upload', fileMapping])
    else:
      actions.append(['upload', fileMapping])

  for file in targetFileMap:
    if not sourceFileMap.__contains__(file):
      actions.append(['remove', file])

  return actions


def performFiles(remote, actions):
  dirMaked = []
  for action in actions:
    print(action)
    if action[0] == 'upload':
      targetPath = os.path.join(serverRoot, action[1].targetFile)
      targetDir = os.path.dirname(targetPath)
      tbMaked = []
      while targetDir != '/':
        tbMaked.append(targetDir)
        targetDir = os.path.dirname(targetDir)
      tbMaked.reverse()
      for tbm in tbMaked:
        if not tbm in dirMaked:
          remote.mkdir(tbm)
          dirMaked.append(tbm)
      print(targetPath, action[1].sourceFile)
      remote.upload_sync(remote_path=targetPath, local_path=action[1].sourceFile)
    if action[0] == 'remove':
      targetPath = os.path.join(serverRoot, action[1])
      remote.clean(targetPath)


def performSummary(remote, summary):
  bytes = dump(summary)
  localFile = '/tmp/summary.yml'
  f = open(localFile, 'w')
  f.write(bytes)
  f.close()
  remote.upload_sync(remote_path=os.path.join(serverRoot, 'summary.yml'), local_path=localFile)


if __name__ == '__main__':
  import urllib3
  urllib3.disable_warnings()

  from configparser import ConfigParser
  config = ConfigParser()
  config.read('publish.ini')
  options = {
      'webdav_hostname': f"https://{config.get('Publish', 'Address')}:{config.get('Publish', 'Port')}",
      'webdav_login': config.get('Publish', 'Username'),
      'webdav_password': config.get('Publish', 'Password'),
      'disable_check': True,
  }
  client = Client(options)
  client.verify = False  # To not check SSL certificates (Default = True)

  # f = open('../public/version', 'w')
  # f.write(datetime.datetime.now().isoformat().split('.')[0].replace(':', '').replace('-', '').replace('T', ''))
  # f.close()

  fileMappings = prepareFileMappings()
  sourceFileStructure = prepareSourceFileStructure(fileMappings)
  targetFileStructure = loadTargetFileStructure(client, serverRoot, 'summary.yml')
  actions = differential(fileMappings, sourceFileStructure, targetFileStructure)
  performFiles(client, actions)
  performSummary(client, sourceFileStructure)
