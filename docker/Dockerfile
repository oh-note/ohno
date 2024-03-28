FROM ubuntu:22.04 as base
FROM node:18.7.0

ARG DEBIAN_FRONTEND="noninteractive"
ENV TZ=Asia/Shanghai

# ********************************************************************************
#
# stage 0: base
# ********************************************************************************

RUN apt-get update && apt-get install -y --no-install-recommends \
    apt-transport-https ca-certificates build-essential \
    git vim sudo \
    # python
    python3-dev \
    python3-venv \
    python3-pip \
    virtualenv \
    swig \
    tzdata \
    # tablgen
    libncurses5-dev libncurses5 \
    # tools
    parallel \
    curl wget \
    unzip

RUN update-alternatives --install /usr/bin/python python /usr/bin/python3 10

RUN apt-get install -y openssh-server openssh-client
RUN apt-get install -y git-core bash-completion
RUN git config --global user.name haozhe
RUN git config --global user.email sailist@outlook.com
RUN git config --global http.sslVerify false
RUN git config --global credential.helper store
RUN git config --global core.quotepath off 

WORKDIR /workspace

USER root
RUN mkdir /run/sshd

# configure user login
ARG USER
RUN useradd -ms /bin/bash ${USER} && usermod -aG sudo ${USER} && echo "${USER} ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

## configure passwd
RUN echo 'root:0' | chpasswd
RUN echo "${USER}:0" | chpasswd


CMD ["/usr/sbin/sshd", "-D"]