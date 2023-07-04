import os
import re

match_handle_method = re.compile(' +handle[a-zA-Z0-9]+\(')
for root, dirs, fs in os.walk('./'):
    for f in fs:
        absf = os.path.join(root, f)
        # TODO
