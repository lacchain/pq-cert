FROM sj26/mailcatcher as mailcatcher

RUN wget https://github.com/msoap/shell2http/releases/download/1.13/shell2http_1.13_amd64.deb
RUN echo "4f41498fd58b9ddb856aef7ef59c267a3cf681a7d576eb9a73a376f5e88e92b2 shell2http_1.13_amd64.deb" | sha256sum --check --status
RUN dpkg -i shell2http_1.13_amd64.deb

RUN echo '#!/bin/sh\n\
set -x\n\
shell2http /shutdown "kill \$(ps aux | grep '\''[/]usr/local/bin/ruby '\'' | awk '\''{print \$2}'\'')" &>/dev/null\n\
mailcatcher --foreground --ip 0.0.0.0\n'\
>> /run.sh

RUN chmod +x /run.sh

ENTRYPOINT []
CMD ["/run.sh"]